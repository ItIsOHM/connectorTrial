import { KuCoinPrivateConnector } from "./private/kucoin-spot-private-connector";
import { onMessage } from "./public/event-handlers";
import { config } from "dotenv";
import logger from "./logger";
import { v4 as uuidv4 } from "uuid";

config();

const testRateLimitingRest = async (privateConnector: KuCoinPrivateConnector) => {
  const orders = [];

  // Simulate rapid place order requests to test rate limiting
  for (let i = 0; i < 20; i++) {
    const placeOrderExample = {
      clientOid: uuidv4(),
      side: "buy" as "buy",
      symbol: "BTC-USDT",
      type: "limit" as "limit",
      price: (20000 + i * 10).toString(), // Increment price slightly to avoid conflicts
      size: "0.01",
      timeInForce: "GTC" as "GTC",
    };

    // Push promises to array
    orders.push(privateConnector.placeOrder(placeOrderExample).catch((error) => {
      logger.error(`Error placing order ${i + 1}: ${(error as Error).message}`);
    }));
  }

  // Wait for all orders to complete
  await Promise.all(orders);
};

const testRateLimitingBalance = async (privateConnector: KuCoinPrivateConnector) => {
  const balanceRequests = [];

  // Simulate rapid balance requests
  for (let i = 0; i < 20; i++) {
    balanceRequests.push(privateConnector.getBalance("ETH").catch((error) => {
      logger.error(`Error fetching balance ${i + 1}: ${(error as Error).message}`);
    }));
  }

  // Wait for all balance requests to complete
  await Promise.all(balanceRequests);
};

// Testing the private connector only.
const main = async () => {
  /**
   * PRIVATE CONNECTOR EXAMPLE
   */

  // Initialize the private connector
  const apiKey = process.env.KUCOIN_API_KEY;
  const apiSecret = process.env.KUCOIN_API_SECRET;
  const apiPassphrase = process.env.KUCOIN_API_PASSPHRASE;

  if (!apiKey || !apiSecret || !apiPassphrase) {
    throw new Error("Missing required environment variables for KuCoin API");
  }

  const privateConnector = new KuCoinPrivateConnector(
    apiKey,
    apiSecret,
    apiPassphrase,
    onMessage
  );

  // Connect the private connector
  await privateConnector.connect();

  // Test rate limiting for REST API (placing orders)
  logger.info("Testing REST API rate limiting (placing orders)...");
  await testRateLimitingRest(privateConnector);

  // Test rate limiting for REST API (balance requests)
  logger.info("Testing REST API rate limiting (balance requests)...");
  await testRateLimitingBalance(privateConnector);

  const shutdown = async () => {
    logger.info("Shutting down connectors...");
    privateConnector.stop();
    logger.info("Connectors stopped.");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // example timeout to shut down the connectors after 60 seconds.
  setTimeout(async () => {
    await shutdown();
  }, 60000);
};

main();
