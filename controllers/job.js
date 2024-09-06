const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createJob = async (req, res) => {
  const { title,  subTitle, description, location } = req.body;


  try {
    const job = await prisma.job.create({
      data: { 
        title, 
        subTitle, 
        description, 
       location
      },
    });
    res.status(201).json({ message: 'job created successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job ', e : error.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await prisma.job.findMany();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  }
};

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
  const { title,  subTitle, description, location } = req.body;


  try {
    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { 
        title, 
        subTitle, 
        description,
        location,
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


