#!/usr/bin/env node

/**
 * 🕐 SCHEDULED IMPORT CRON JOB
 * 
 * This script runs scheduled episode imports based on database configuration.
 * It should be run via cron job or scheduled task.
 * 
 * Usage:
 *   node scripts/scheduledImportCron.js
 * 
 * Cron example (every hour):
 *   0 * * * * cd /path/to/animehub && node scripts/scheduledImportCron.js
 * 
 * Cron example (every 6 hours):
 *   0 */6 * * * cd /path/to/animehub && node scripts/scheduledImportCron.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key'

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Import the scheduled import service
const { ScheduledImportService } = require('../src/services/scheduledImportService')

class ScheduledImportCron {
  constructor() {
    this.startTime = Date.now()
    this.results = []
  }

  async run() {
    try {
      console.log('🕐 Scheduled Import Cron Job Started')
      console.log('=' .repeat(50))
      console.log(`⏰ Time: ${new Date().toLocaleString()}`)
      
      // Run all due imports
      const results = await ScheduledImportService.runAllDueImports()
      
      if (results.length === 0) {
        console.log('✅ No due imports found')
        return
      }
      
      // Log results
      console.log(`\n📊 Results Summary:`)
      console.log(`   Configurations Run: ${results.length}`)
      
      let totalAnime = 0
      let totalEpisodes = 0
      let successfulRuns = 0
      let failedRuns = 0
      
      results.forEach((result, index) => {
        console.log(`\n📋 Configuration ${index + 1}:`)
        console.log(`   Success: ${result.success ? '✅' : '❌'}`)
        console.log(`   Anime Processed: ${result.animeProcessed}`)
        console.log(`   Episodes Found: ${result.episodesFound}`)
        console.log(`   Duration: ${result.duration}ms`)
        
        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.length}`)
          result.errors.slice(0, 3).forEach(error => {
            console.log(`     - ${error}`)
          })
          if (result.errors.length > 3) {
            console.log(`     ... and ${result.errors.length - 3} more errors`)
          }
        }
        
        totalAnime += result.animeProcessed
        totalEpisodes += result.episodesFound
        
        if (result.success) {
          successfulRuns++
        } else {
          failedRuns++
        }
      })
      
      console.log(`\n🎉 Final Summary:`)
      console.log(`   Total Anime Processed: ${totalAnime}`)
      console.log(`   Total Episodes Found: ${totalEpisodes}`)
      console.log(`   Successful Runs: ${successfulRuns}`)
      console.log(`   Failed Runs: ${failedRuns}`)
      console.log(`   Total Duration: ${Date.now() - this.startTime}ms`)
      
      // Log to file if needed (optional)
      await this.logToFile(results)
      
    } catch (error) {
      console.error('❌ Cron job failed:', error)
      process.exit(1)
    }
  }

  async logToFile(results) {
    try {
      const fs = require('fs')
      const path = require('path')
      
      const logDir = path.join(__dirname, '../logs')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      
      const logFile = path.join(logDir, `scheduled-import-${new Date().toISOString().split('T')[0]}.log`)
      const logEntry = {
        timestamp: new Date().toISOString(),
        results: results,
        summary: {
          totalConfigs: results.length,
          totalAnime: results.reduce((sum, r) => sum + r.animeProcessed, 0),
          totalEpisodes: results.reduce((sum, r) => sum + r.episodesFound, 0),
          successfulRuns: results.filter(r => r.success).length,
          failedRuns: results.filter(r => !r.success).length,
          duration: Date.now() - this.startTime
        }
      }
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
      console.log(`📝 Results logged to: ${logFile}`)
      
    } catch (error) {
      console.warn('⚠️ Failed to log to file:', error.message)
    }
  }
}

// Main execution
async function main() {
  const cron = new ScheduledImportCron()
  await cron.run()
  
  console.log('\n🏁 Scheduled Import Cron Job Completed')
  process.exit(0)
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = ScheduledImportCron

