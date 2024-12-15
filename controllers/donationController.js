

async fetchAllDonors(req, res) {
  try {
    // Fetch all donations along with associated donor information
    const donors = await prisma.donation.findMany({
      include: {
        transaction: {
          select: {
            tx_ref: true,
            amount: true,
            currency: true,
            status: true,
            transactionMethod: true, // You can customize this based on what's needed
            createdAt: true,
          },
        },
      },
    });

    // Return the list of donors and their donation history
    res.json({
      success: true,
      donors: donors.map(donation => ({
        donorName: donation.donorName || "Anonymous", // Show 'Anonymous' for missing donor names
        donationHistory: donation.transaction,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error fetching donors: ${error.message}`,
    });
  }
}
