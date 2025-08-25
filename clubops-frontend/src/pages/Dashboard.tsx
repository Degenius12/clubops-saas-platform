import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Calendar, TrendingUp, Sparkles, Music } from 'lucide-react';

const stats = [
  { name: 'Active Dancers', value: '24', change: '+4', icon: Users, color: 'bg-blue-500' },
  { name: 'Daily Revenue', value: '$12,847', change: '+12%', icon: DollarSign, color: 'bg-green-500' },
  { name: 'VIP Bookings', value: '18', change: '+8', icon: Sparkles, color: 'bg-purple-500' },
  { name: 'Queue Length', value: '6', change: '-2', icon: Music, color: 'bg-indigo-500' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Good Evening, Manager
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Here's what's happening at your club today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Check In Dancer</p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
            <Music className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Manage Queue</p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
            <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">VIP Booking</p>
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            { action: 'Dancer check-in', name: 'Madison', time: '2 minutes ago' },
            { action: 'VIP booking', name: 'Room 3', time: '15 minutes ago' },
            { action: 'DJ queue update', name: 'Stage 1', time: '23 minutes ago' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.action}: {activity.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}