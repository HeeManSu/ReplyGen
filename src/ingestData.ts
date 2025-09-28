const data = {
  companyName: "Flipkart",
  emails: [
    "Just wanted to follow up and see if you had a chance to review our earlier note. Flipkart can help optimize your marketplace listings in just a few clicks.",
    "Our platform is built to increase visibility for sellers. With Flipkart, you can rank higher and reach more customers effortlessly.",
    "Managing your online store shouldn't take all your time. Flipkart automates repetitive tasks so you can focus on strategy.",
    "Sellers using Flipkart have seen an average 23% increase in conversion within 2 months. Let's explore how this could work for you.",
    "Growing on Amazon and Flipkart is challenging. Flipkart makes it simple by combining automation with actionable insights.",
    "Manual updates eat up hours. Flipkart's automated listing optimization helps you save time and improve consistency.",
    "The e-commerce space is competitive. With Flipkart's AI-powered tools, you can identify trends before others and act quickly.",
    "Reporting shouldn't feel overwhelming. Flipkart gives you clean, actionable dashboards designed for sellers.",
    "Hundreds of sellers trust Flipkart to scale across multiple marketplaces without extra effort. You can too.",
    "Our tools highlight the best keywords for your products and ensure your listings are optimized for visibility.",
    "With real-time insights, Flipkart helps you make smarter business decisions that actually move the needle.",
    "We don't just show numbers. Flipkart turns your data into recommendations you can implement immediately.",
    "Going multi-channel? Flipkart lets you manage multiple stores from one dashboard. Simple and efficient.",
    "Our support team works exclusively with online sellers. We understand your challenges and are here to help.",
    "Flipkart delivers insights based on actual performance, not guesswork. That's why sellers rely on us every day.",
    "Manual updates often lead to errors. Flipkart's automated tools ensure consistency across your listings.",
    "Scaling doesn't have to mean extra work. Flipkart helps you grow while keeping operations lean.",
    "The tools we've built are designed for today's fast-moving e-commerce sellers. Flexible, reliable, and easy to use.",
    "Flipkart takes care of repetitive updates so you can focus on big-picture growth.",
    "Sellers who partner with us don't just get data - they get measurable results that impact revenue.",
  ],
};

const ingestData = async () => {
  console.log("Ingesting data...");
  try {
    console.log("Fetching data...");
    const response = await fetch("http://localhost:3002/api/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log("Response:", response);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Ingest successful:", result);
  } catch (error) {
    console.error("Ingest failed:", error);
  }
};

ingestData();
