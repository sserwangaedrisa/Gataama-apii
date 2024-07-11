const nodemailer = require('nodemailer');
const db = require('../middleware/db');

exports.contactForm = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    const dt = {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
    }
    const sql = `INSERT INTO contact SET ?`;
    connection.query(sql, dt, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(201).send({
        message: "Your message has been sent successfully. kindly await a response via email",
      });
    });
  });
};

exports.petitionForm = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    const dt = {
      country: req.body.country,
      email: req.body.email,
      address: req.body.address,
      phone: req.body.phone,
      names: req.body.names,
    }
    const sql = `INSERT INTO petition SET ?`;
    connection.query(sql, dt, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(201).send({
        message: "You have joined our petition  successfully.",
      });
    });
  });
};

exports.careerForm = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    let image, sql
    if (req.file) {
      image = `${process.env.API_URL}/cvs/${req.file.filename}`;
    }
    const dt = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      country: req.body.country,
      cv: image,
      message: req.body.message,
      role: req.body.role,
    }
    sql = `INSERT INTO careers SET ?`;
    connection.query(sql, dt, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(201).send({
        message: "Your info has been recieved. kindly await our response via email or phone",
      });
    });
  });
};

exports.getVolunteers = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    sql = `SELECT * FROM careers WHERE role = 'volunteer' ORDER BY id DESC LIMIT 0,20`;
    connection.query(sql, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(200).send({
        volunteers: result,
      });
    });
  });
};

exports.getPetitions = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    sql = `SELECT * FROM petition ORDER BY id DESC`;
    connection.query(sql, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(200).send({
        petitions: result,
      });
    });
  });
};

exports.getJobs = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    sql = `SELECT * FROM careers WHERE role != 'volunteer' ORDER BY id DESC LIMIT 0,20`;
    connection.query(sql, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(200).send({
        jobSeekers: result,
      });
    });
  });
};

exports.getMessages = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    sql = `SELECT * FROM contact ORDER BY id DESC LIMIT 0,20`;
    connection.query(sql, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      res.status(200).send({
        messages: result,
      });
    });
  });
};

exports.editCareersForm = async (req, res) => {
  await db.getConnection((err, connection) => {
    if (err) {
      console.log('err', err)
      return res.status(500).send({
        message: process.env.ERROR_MESSAGE,
      });
    }
    const entries = Object.keys(req.body);
    const updates = {};
    for (let i = 0; i < entries.length; i++) {
      updates[entries[i]] = Object.values(req.body)[i];
    }
    sql = `UPDATE careers SET ? WHERE id = ${req.params.id}`;
    connection.query(sql, updates, (err3, result) => {
      connection.release();
      if (err3) {
        return res.status(500).send({
          message: process.env.ERROR_MESSAGE,
        });
      }
      return res.status(200).send({
        message: "Updated info successfully",
      });
    });
  });
};
