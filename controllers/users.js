const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('../middleware/db');

exports.register = async (req, res) => {
  const pwd = `${Math.floor(1000 + Math.random() * 9000)}rfh`;
  const hash = await bcrypt.hash(pwd, 10);
  await db.getConnection((err, connection) => {
    if (err) {
      // console.log('err', err)
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    // get user details
    const userDetail = {
      fullNames: req.body.fullNames,
      email: req.body.email,
      password: hash,
    };
    let sql = 'SELECT * FROM users WHERE email = ?';
    connection.query(sql, req.body.email, (err1, result) => {
      if (err1) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      if (result.length === 1) {
        connection.release();
        return res.status(403).send({
          message: 'Email taken, use a different one',
        });
      } else {
      sql = 'INSERT INTO users SET ?';
      connection.query(sql, userDetail, (err2, result2) => {
        connection.release();
        if (err2) {
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
        let msgs = `<p>Hello <b>${userDetail.fullNames}</b>,</p>
        <p>An admin account has been successfully created on your behalf for the website <a href="https://gataama.com">https://gataama.com</a></p>
        <p>Find below your login credentials</p>
        <p>Email : ${userDetail.email}</p>
        <p>Password : ${pwd}</p>
        <p><a href="https://admin.gataama.com">Click here to login to your account</a></p>`
        const message = {
          from: `"Gataama" <${process.env.SENDER_EMAIL}>`,
          to: userDetail.email,
          subject: 'Welcome aboard - Gataama',
          html: `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome Tickets2Go</title>
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
                    ${msgs}
                    <p>Best,</p>
                    <p>The Gataama Team.</p>
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
            // console.log('email send err', err3)
            return res.status(500).send({
              error: process.env.ERROR_MESSAGE,
            });
          }
          return res.status(201).send({
            message: `Created account for ${userDetail.fullNames} successfully`,
          });
        });
      });
    }
    });
  });
};

exports.login = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    // check if email provided exists
    const sql = 'SELECT * FROM users WHERE email = ?';
    connection.query(sql, req.body.email, (err1, result) => {
      connection.release();
      if (err1) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      // console.log('result', result)
      // return res.status(500).send({
      //   message: process.env.ERROR_MESSAGE,
      // });
      if (result.length === 1) {
        let row = result[0];
        //  check if account is activated
        if (Number(row.status) === 0) {
          return res.status(403).send({
            message: 'Your Account is locked, contact a website admin',
          });
        }
        // console.log("passwords", req.body.password, row.password)
        bcrypt.compare(req.body.password.toString(), row.password, async (err2, response) => {
          if (err2) {
            // console.log('err2', err2)
            return res.status(500).send({
              message: process.env.ERROR_MESSAGE,
            });
          }
          if(response){
            const token = jwt.sign(
              {
                id: row.id,
                email: req.body.email,
                status: row.status,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: process.env.JWT_EXPIRATION_TIME,
              },
            );
            return res.status(200).send({
              message: 'logged in successfully',
              token: token,
              user: {
                id: row.id,
                fullNames: row.fullNames,
                email: row.email,
                status: row.status,
                createdAt: row.createdAt,
              },
            });
          } else {
            res.status(406).send({
              message: 'Invalid Email or Password',
            });
          }
        })
      } else {
        // email doesnt exist
        res.status(406).send({
          message: 'Account issue, contact a website admin',
        });
      }
    });
  });
};

exports.forgotPassword = async (req, res) => {
  // this controller enables a user to reset their password
  const pwd = `${Math.floor(1000 + Math.random() * 9000)}rfh`;
  const hash = await bcrypt.hash(pwd, 10);

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    // check wether email exists
    const sql = 'SELECT id FROM users WHERE email = ?';
    connection.query(sql, req.body.email, (err1, result) => {
      if (err1) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }

      if (result.length === 1) {
        // update pwd for that email
        const sql1 = `UPDATE users SET password = '${hash}' WHERE email = '${req.body.email}'`;
        connection.query(sql1, (err2, result) => {
          connection.release();
          if (err2) {
            return res.status(500).send({
              message: process.env.ERROR_MESSAGE,
            });
          }

          // send an email with new pwd
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
            to: req.body.email,
            subject: 'Gataama - Password Change',
            html: `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome Tickets2Go</title>
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
                    <p>Your new account password is  ${pwd}</p>
                    <p>Access your account <a href='https://admin.gataama.com/' target='blank'>here</a></p>
                      <p>Best,</p>
                      <p>The Gataama Team.</p>
                    </div>
                  </div>
                </div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/js/bootstrap.min.js"
                  integrity="sha512-5BqtYqlWfJemW5+v+TZUs22uigI8tXeVah5S/1Z6qBLVO7gakAOtkOzUtgq6dsIo5c0NJdmGPs0H9I+2OHUHVQ=="
                  crossorigin="anonymous" referrerpolicy="no-referrer"></script>
                <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
              </body>
            </html>`,
          };

          transporter.sendMail(message, (err3, info) => {
            if (err3) {
              return res.status(500).send({
                success: false,
                error: err3,
              });
            }
            return res.status(200).send({
              success: true,
              message: 'Check your email for further instructions',
            });
          });
        });
      } else {
        // if email doesnt exist
        res.status(403).send({
          message: 'Account issue, contact a website admin',
        });
      }
    });
  });
};

exports.fillProfile = async (req, res) => {
  // this controller updates a user account info
  // check if password exists
  if (req.body.password) {
    const hash = await bcrypt.hash(req.body.password, 10);
    const other = {
      password: hash,
    };
    Object.assign(req.body, other);
  }
  const entries = Object.keys(req.body);
  const updates = {
    updatedBy: req.userData.id
  };
  for (let i = 0; i < entries.length; i++) {
    updates[entries[i]] = Object.values(req.body)[i];
  }
  // post to data
  await db.getConnection((err, connection) => {
    if (err) {
      console.log('err', err)
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    const sql = `UPDATE users SET ? WHERE id = ${req.params.id}`;
    connection.query(sql, updates, (err1, result) => {
      connection.release();
      if (err1) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      // return result to user
      res.status(200).send({
        message: 'updated user details successfully',
      });
    });
  });
};

exports.deleteUser = async (req, res, next) => {
  // delete all user data
  // suggestion to use soft deletes instead <REFACTOR THIS CODE>
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send(errors);
    }
    const sql = `DELETE from users WHERE id = ${req.params.id}`;
    connection.query(sql, (err, result) => {
      connection.release();
      if (err) {
        return res.status(500).send({
          success: false,
          message: err,
        });
      }
      // return result to user
      res.status(200).send({
        success: true,
        message: 'user deleted successfully',
      });
    });
  });
};
