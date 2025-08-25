import React from 'react';
import { motion } from 'framer-motion';

export default function VIPRooms() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          VIP Room Management
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Track VIP room bookings, timers, and revenue.
        </p>
      </div>
    </motion.div>
  );
}