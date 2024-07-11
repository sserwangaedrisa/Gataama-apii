const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const url = require('url');
const axios = require('axios')
const https = require('https');
const db = require('../middleware/db');

exports.getPaymentUrl = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    if (Number(req.body.amount) > 0) {
      const formData = {
        tx_ref: uuidv4(),
        amount: req.body.amount,
        currency: req.body.currency,
        redirect_url: `${process.env.PAYMENT_URL}/donation-status`,
        customer: {
          email: req.body.email,
          name: req.body.fullNames,
        },
        meta: {
          donationType: req.body.donationType,
        },
        customizations: {
          title: "Gataama",
          logo: "https://gatamaapi.tickets2go.net/avatars/logo.jpg",
          description: `Donation for ${req.body.donationTitle}`
        },
        // payment_options: "card, account, banktransfer, mpesa, mobilemoneyghana, mobilemoneyfranco, mobilemoneyuganda, mobilemoneyrwanda, mobilemoneyzambia, nqr, ussd"
      }
      const a = axios.create({
        headers: {
          Authorization: `Bearer ${process.env.FLWV_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        httpsAgent: new https.Agent({ keepAlive: true }),
      });
      let baseURL = `https://api.flutterwave.com/v3/payments`;
      a.post(baseURL, formData)
        .then(response => {
          // handle success
          // console.log('getPaymentUrl response', response.data)
          const dt = {
            tx_ref: formData.tx_ref,
            amount: formData.amount,
            currency: formData.currency,
            donationType: req.body.donationType,
            email: formData.customer.email,
            fullNames: formData.customer.name,
            transactionType: "deposit"
          }
          if (response.data.data.link) {
            const sql = 'INSERT INTO transactions SET ?';
            connection.query(sql, dt, (err1, result) => {
              connection.release();
              if (err1) {
                return res.status(500).send({
                  message: process.env.ERROR_MESSAGE,
                });
              }
              return res.status(200).send({
                url: response.data.data.link,
              });
            });
          } else {
            return res.status(500).send({
              message: 'failed to load payment screen, kindly try again',
            });
          }
        })
        .catch(error => {
          if (error.response) {
            // The request was made and the server responded with a status code
            console.log('error1', error.response.data);
          } else if (error.request) {
            // The request was made but no response was received
            console.log('error2, Network Error');
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log('error3, Something happened in setting up the request that triggered an Error');
          }
          res.status(500).send({
            message: process.env.ERROR_MESSAGE,
          });
        });
    } else {
      return res.status(403).send({
        message: "Invalid amount set",
      });
    }

  });
};

exports.webhookUrl = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: "Error with payment, kindly contact support",
      });
    }
    const current_url = new URL(`${process.env.PAYMENT_URL}/${req.originalUrl}`);
    const search_params = current_url.searchParams;
    if (search_params.get('status') == 'successful') {
      // confirm payment status
      const a = axios.create({
        headers: {
          Authorization: `Bearer ${process.env.FLWV_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        httpsAgent: new https.Agent({ keepAlive: true }),
      });
      let baseURL = `https://api.flutterwave.com/v3/transactions/${search_params.get('transaction_id')}/verify`;
      a.get(baseURL)
        .then(response => {
          // handle success
          let sql = 'SELECT * FROM transactions WHERE tx_ref = ?';
          connection.query(sql, search_params.get('tx_ref'), (err2, result) => {
            if (err2) {
              return res.status(500).send({
                message: process.env.ERROR_MESSAGE,
              });
            }
            let dt = {
              status: search_params.get('status'),
              transactionId: search_params.get('transaction_id'),
              transactionSummary: JSON.stringify(response.data.data),
            }
            sql = 'UPDATE transactions SET ? WHERE id = ?';
            connection.query(sql, [dt, result[0].id], (err2, result1) => {
              if (err2) {
                return res.status(500).send({
                  message: process.env.ERROR_MESSAGE,
                });
              }
              // update wallet balance
              sql = 'SELECT * FROM wallet WHERE symbol = ?';
              connection.query(sql, result[0].currency, (err3, result2) => {
                if (err3) {
                  return res.status(500).send({
                    message: process.env.ERROR_MESSAGE,
                  });
                }
                const amt = Number(result2[0].amount) + Number(result[0].amount)
                dt={
                  amount: amt
                }
                sql = 'UPDATE wallet SET ? WHERE id = ?';
                connection.query(sql, [dt, result2[0].id], (err4, result3) => {
                  connection.release();
                  if (err4) {
                    return res.status(500).send({
                      message: process.env.ERROR_MESSAGE,
                    });
                  }
                })
              })
              // send email thanking donar
              // send admin notification
              const transporter = nodemailer.createTransport({
                host: 'smtp.ionos.com',
                port: 587,
                auth: {
                  user: process.env.SENDER_EMAIL,
                  pass: process.env.SENDER_EMAIL_PASSWORD,
                },
              });
              const message = {
                from: `"Gataama" <${process.env.SENDER_EMAIL}>`,
                to: result[0].email,
                subject: `Thank you for your Donation`,
                html: `<!DOCTYPE html>
                  <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Reciept Gataama</title>
                      <link rel="preconnect" href="https://fonts.googleapis.com">

                      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

                      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;400;700&display=swap" rel="stylesheet">
                      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/css/bootstrap.min.css"
                        integrity="sha512-CpIKUSyh9QX2+zSdfGP+eWLx23C8Dj9/XmHjZY2uDtfkdLGo0uY12jgcnkX9vXOgYajEKb/jiw67EYm+kBf+6g=="
                        crossorigin="anonymous" referrerpolicy="no-referrer" />
                      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet" />
                    </head>
                    <body>
                      <div class="container">
                        <div class="row">
                          <div class="col">
                            <p>Dear ${result[0].fullNames}</p>
                            <p>I hope this message finds you well. On behalf of Gataama, I want to express our deepest gratitude for your generous donation of ${result[0].currency} ${result[0].amount} to support our cause.</p>
                            <p>Your contribution means more than words can express. With your support, we can continue our efforts to promote unity, empowerment, and progress across the African continent and its diaspora. Your belief in our mission is truly inspiring, and it reaffirms our commitment to making a positive impact in the lives of people throughout Africa and beyond.</p>
                            <p>Your donation will directly contribute to initiatives aimed at fostering social, economic, and political development, as well as promoting cultural exchange and solidarity among African communities worldwide.</p>
                            <p>Once again, thank you for your generosity and support. Together, we can work towards a brighter future for all Africans.</p>
                            <p>With heartfelt thanks,</p>
                            <br />
                            <p>Best,</p>
                            <h3>The Management of GATAAMA FOUNDATION.</h3>
                          </div>
                        </div>
                      </div>
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/js/bootstrap.min.js"
                        integrity="sha512-5BqtYqlWfJemW5+v+TZUs22uigI8tXeVah5S/1Z6qBLVO7gakAOtkOzUtgq6dsIo5c0NJdmGPs0H9I+2OHUHVQ=="
                        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
                      <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
                    </body>
                  </html>
                  `
              };

              transporter.sendMail(message, (err3, info) => {
                if (err3) {
                  console.log('email send err', err3)
                  return res.status(500).send({
                    error: process.env.ERROR_MESSAGE,
                  });
                }
                return res.status(200).send({
                  message: `Thank you for your Donation, check your email (${result[0].email})`,
                });
              });

            });
            
          });
        })
        .catch(error => {
          console.log('error', error)
          if (error.response) {
            // The request was made and the server responded with a status code
            console.log('error1', error.response.data);
          } else if (error.request) {
            // The request was made but no response was received
            console.log('error2, Network Error');
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log('error3, Something happened in setting up the request that triggered an Error');
          }
          let sql = 'SELECT * FROM transactions WHERE tx_ref = ?';
          connection.query(sql, search_params.get('tx_ref'), (err, result) => {
            if (err) {
              console.log('err2', err);
              return res.status(500).send({
                message: process.env.ERROR_MESSAGE,
              });
            }
            const transporter = nodemailer.createTransport({
              host: 'smtp.ionos.com',
              port: 587,
              auth: {
                user: process.env.SENDER_EMAIL,
                pass: process.env.SENDER_EMAIL_PASSWORD,
              },
            });
            const message = {
              from: process.env.SENDER_EMAIL,
              to: result[0].email,
              subject: 'Payment Issue - Tickets2Go',
              html: `<!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Reciept Gataama</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">

                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

                  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;400;700&display=swap" rel="stylesheet">
                  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/css/bootstrap.min.css"
                    integrity="sha512-CpIKUSyh9QX2+zSdfGP+eWLx23C8Dj9/XmHjZY2uDtfkdLGo0uY12jgcnkX9vXOgYajEKb/jiw67EYm+kBf+6g=="
                    crossorigin="anonymous" referrerpolicy="no-referrer" />
                  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet" />
                </head>
                <body>
                  <div class="container">
                    <div class="row">
                      <div class="col">
                        <p>Dear ${result[0].fullNames}</p>
                        <p><b>We could not verify your transaction</b></p>
                      <p>Kindly <a href="https://gataama.com/contact">contact support</a> with the following information</p>
                      <p>Transaction Status : ${search_params.get('status')}</p>
                      <p>Transaction Id : ${search_params.get('transaction_id')}</p>
                      <p>Transaction Ref : ${search_params.get('tx_ref')}</p>
                        <br />
                        <p>Best,</p>
                        <h3>The Management of GATAAMA FOUNDATION.</h3>
                      </div>
                    </div>
                  </div>
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/js/bootstrap.min.js"
                    integrity="sha512-5BqtYqlWfJemW5+v+TZUs22uigI8tXeVah5S/1Z6qBLVO7gakAOtkOzUtgq6dsIo5c0NJdmGPs0H9I+2OHUHVQ=="
                    crossorigin="anonymous" referrerpolicy="no-referrer"></script>
                  <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
                </body>
              </html>
              
                      `,
            };

            transporter.sendMail(message, (err3, info) => {
              if (err3) {
                console.log('email send err', err3)
                return res.status(500).send({
                  success: false,
                  error: process.env.ERROR_MESSAGE,
                });
              }
              return res.status(200).send({
                success: true,
                message: `Kindly check your email (${result[0].customerEmail}) for more details`,
              });
            });
          });
        });
    } else {
      const dt = {
        status: search_params.get('status'),
        transactionId: search_params.get('transaction_id'),
      }
      let sql = 'UPDATE transactions SET ? WHERE tx_ref = ?';
      connection.query(sql, [dt, search_params.get('tx_ref')], (err, result) => {
        connection.release();
        if (err) {
          console.log('err2', err);
        }
        // send email saying payment failed
        res.status(200).send({
          message: "payment failed, kindly retry",
        });
      });
    }
  });
}

exports.getCurrencies = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      console.log("err", err)
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    sql = `SELECT * FROM wallet WHERE status = 1 ORDER BY currency ASC`;
    connection.query(sql, (err3, result) => {
      connection.release();
      if (err3) {
        console.log("err3", err3)
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(200).send({
        currencies: result,
      });
    });
  });
};

exports.getAdminAnalytics = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    let sql = `SELECT * FROM wallet WHERE amount > 0 AND status = 1 ORDER BY currency ASC`;
    connection.query(sql, (err2, result) => {
      if (err2) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      sql = `SELECT * FROM transactions WHERE status = 'successful' ORDER BY createdAt DESC LIMIT 0,20`;
      connection.query(sql, (err3, result2) => {
        connection.release();
        if (err3) {
          return res.status(500).send({
            message: process.env.ERROR_MESSAGE,
          });
        }
        res.status(200).send({
          wallets: result,
          transactions: result2,
        });
      });
    });
  });
};
