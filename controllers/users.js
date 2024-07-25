const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const db = require("../middleware/db");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

exports.register = async (req, res) => {
  // const pwd = `${Math.floor(1000 + Math.random() * 9000)}rfh`;
  try {
    if (req.body.password == "") {
      return res.status(403).send({
        message: "please add password",
      });
    }
    const existingUser = await prisma.user.findFirst({
      where: { email: req.body.email },
    });

    if (existingUser) {
      return res.status(403).send({
        message: "Email taken, use a different one",
      });
    }
    const hash = await bcrypt.hash(req.body.password, 10);

    const user = await prisma.user.create({
      data: {
        fullNames: req.body.fullNames,
        email: req.body.email,
        password: hash,
        role: req.body.role,
      },
    });

    //   const transporter = nodemailer.createTransport({
    //     host: "smtp.ionos.com",
    //     port: 587,
    //     auth: {
    //       user: process.env.SENDER_EMAIL,
    //       pass: process.env.SENDER_EMAIL_PASSWORD,
    //     },
    //   });

    //   let msgs = `<p>Hello <b>${user.fullNames}</b>,</p>
    //       <p>An admin account has been successfully created on your behalf for the website <a href="https://gataama.com">https://gataama.com</a></p>
    //       <p>Find below your login credentials</p>
    //       <p>Email : ${user.email}</p>
    //       <p>Password : ${pwd}</p>
    //       <p><a href="https://admin.gataama.com">Click here to login to your account</a></p>`;

    //   const message = {
    //     from: `"Gataama" <${process.env.SENDER_EMAIL}>`,
    //     to: user.email,
    //     subject: "Welcome aboard - Gataama",
    //     html: `<!DOCTYPE html>
    //         <html lang="en">
    //           <head>
    //             <meta charset="UTF-8">
    //             <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //             <title>Welcome Tickets2Go</title>
    //             <link rel="preconnect" href="https://fonts.googleapis.com">

    //             <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    //             <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;400;700&display=swap" rel="stylesheet">
    //             <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/css/bootstrap.min.css"
    //               integrity="sha512-CpIKUSyh9QX2+zSdfGP+eWLx23C8Dj9/XmHjZY2uDtfkdLGo0uY12jgcnkX9vXOgYajEKb/jiw67EYm+kBf+6g=="
    //               crossorigin="anonymous" referrerpolicy="no-referrer" />
    //             <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet" />
    //           </head>
    //           <body>
    //             <div class="container">
    //               <div class="row">
    //                 <div class="col">
    //                   ${msgs}
    //                   <p>Best,</p>
    //                   <p>The Gataama Team.</p>
    //                 </div>
    //               </div>
    //             </div>
    //             <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/js/bootstrap.min.js"
    //               integrity="sha512-5BqtYqlWfJemW5+v+TZUs22uigI8tXeVah5S/1Z6qBLVO7gakAOtkOzUtgq6dsIo5c0NJdmGPs0H9I+2OHUHVQ=="
    //               crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    //             <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    //           </body>
    //         </html>
    //         `,
    //   };

    //   transporter.sendMail(message, (err3, info) => {
    //     if (err3) {
    //       return res.status(500).send({
    //         error: err3,
    //       });
    //     }
    //     return res.status(201).send({
    //       message: `Created account for ${user.fullNames} successfully`,
    //     });
    //   });
    return res.status(201).send({
      message: `Created account for ${user.fullNames} successfully`,
    });
  } catch (error) {
    return res.status(400).send({
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.body.email },
    });

    if (!user) {
      return res.status(406).send({
        message: "Account issue, contact a website admin",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password.toString(),
      user.password
    );
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(406).send({
        message: "Invalid Email or Password",
      });
    }

    if (Number(user.status) === 0) {
      return res.status(403).send({
        message: "Your Account is locked, contact a website admin",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        status: user.status,
      },
      process.env.JWT_SECRET
    );

    return res.status(200).send({
      message: "logged in successfully",
      token: token,
      user: {
        id: user.id,
        fullNames: user.fullNames,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  // Generate a temporary password
  const pwd = `${Math.floor(1000 + Math.random() * 9000)}rfh`;
  const hash = await bcrypt.hash(pwd, 10);

  try {
    // Check if the user with the given email exists
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (user) {
      // Update user's password with the hashed temporary password
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hash,
        },
      });

      // Send an email with the new temporary password
      const transporter = nodemailer.createTransport({
        host: "smtp.ionos.com",
        port: 587,
        auth: {
          user: process.env.SENDER_EMAIL,
          pass: process.env.SENDER_EMAIL_PASSWORD,
        },
      });

      const message = {
        from: `"Gataama" <${process.env.SENDER_EMAIL}>`,
        to: req.body.email,
        subject: "Gataama - Password Reset",
        html: `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Gataama - Password Reset</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/css/bootstrap.min.css"
                integrity="sha512-CpIKUSyh9QX2+zSdfGP+eWLx23C8Dj9/XmHjZY2uDtfkdLGo0uY12jgcnkX9vXOgYajEKb/jiw67EYm+kBf+6g=="
                crossorigin="anonymous" referrerpolicy="no-referrer" />
            </head>
            <body>
              <div class="container">
                <div class="row">
                  <div class="col">
                    <p>Your new account password is ${pwd}</p>
                    <p>Access your account <a href='https://admin.gataama.com/' target='_blank'>here</a></p>
                    <p>Best,</p>
                    <p>The Gataama Team.</p>
                  </div>
                </div>
              </div>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/js/bootstrap.min.js"
                integrity="sha512-5BqtYqlWfJemW5+v+TZUs22uigI8tXeVah5S/1Z6qBLVO7gakAOtkOzUtgq6dsIo5c0NJdmGPs0H9I+2OHUHVQ=="
                crossorigin="anonymous" referrerpolicy="no-referrer"></script>
            </body>
          </html>`,
      };

      transporter.sendMail(message, (err3, info) => {
        if (err3) {
          console.error("Error sending email:", err3);
          return res.status(500).send({
            success: false,
            error: err3,
          });
        }
        return res.status(200).send({
          success: true,
          message: "Check your email for further instructions",
        });
      });
    } else {
      // User with the given email does not exist
      res.status(403).send({
        message: "Account issue, contact a website admin",
      });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send({
      message: process.env.ERROR_MESSAGE,
    });
  }
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
    updatedBy: req.userData.id,
  };
  for (let i = 0; i < entries.length; i++) {
    updates[entries[i]] = Object.values(req.body)[i];
  }
  // post to data
  await db.getConnection((err, connection) => {
    if (err) {
      console.log("err", err);
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
        message: "updated user details successfully",
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
        message: "user deleted successfully",
      });
    });
  });
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullNames: user.fullNames,
      googleId: user.googleId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
          });
          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          } else {
            user = await prisma.user.create({
              data: {
                fullNames: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
              },
            });
          }
        }

        const token = generateToken(user);
        return done(null, { user, token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

exports.getUserFromToken = (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json(decoded);
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
