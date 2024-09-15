const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createJob = async (req, res) => {
  const { title,  subTitle, description, location, deadline, status } = req.body;


  try {
    const job = await prisma.job.create({
      data: { 
        title, 
        subTitle, 
        description, 
       location,
       deadline,
        status,
      },
    });
    res.status(201).json({ message: 'job created successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job ', e : error.message });
  }
};

// controllers/job.js

exports.getJobs = async (req, res) => {
  try {
    // Extract countryId from query parameters
    const { countryId } = req.query;

    // Create query object for filtering
    const query = {};

    // Add location filter if countryId is provided
    if (countryId) {
      query.location = parseInt(countryId, 10);
    }

    // Fetch jobs from the database with optional filtering
    const jobs = await prisma.job.findMany({
      where: query
    });

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  }
};

// Other controller methods...




exports.getJobById = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await prisma.job.findUnique({
      where: { id: parseInt(id) },
    });
    if (job) {
      res.status(200).json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve job' });
  }
};

exports.updateJob = async (req, res) => {
  const { id } = req.params;
  const { title,  subTitle, description, location, deadline, status } = req.body;


  try {
    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { 
        title, 
        subTitle, 
        description,
        location,
        deadline,
        status
      },
    });
    res.status(200).json({ message: 'job updated successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job' });
  }
};

exports.deleteJob = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.job.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
};


