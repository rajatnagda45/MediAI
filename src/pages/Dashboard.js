import React from 'react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto mt-12">
      <h1 className="text-3xl font-bold mb-8">Admin <span className="text-gradient">Dashboard</span></h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: 'Total Patients', value: '1,284', color: 'text-primary' },
          { title: 'Today Appointments', value: '42', color: 'text-secondary' },
          { title: 'Critical Cases', value: '3', color: 'text-red-500' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-2">{stat.title}</p>
            <h2 className={`text-4xl font-bold ${stat.color}`}>{stat.value}</h2>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6">Recent Patients</h2>
        <div className="text-center text-gray-500 py-10">
          Loading patient data...
        </div>
      </div>
    </div>
  );
}