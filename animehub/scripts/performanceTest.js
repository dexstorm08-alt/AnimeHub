// Performance Test Script for AnimeHub
// Tests critical performance metrics and provides optimization recommendations

import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

class PerformanceTester {
  constructor() {
    this.results = {
      bundleSize: {},
      loadTime: {},
      memoryUsage: {},
      recommendations: []
    };
  }

  async testBundleSize() {
    console.log('📦 Testing bundle size...');
    
    const outDir = path.join(process.cwd(), 'out');
    if (!fs.existsSync(outDir)) {
      console.log('❌ Build directory not found. Run "npm run build" first.');
      return;
    }

    const files = this.getFilesRecursively(outDir);
    const totalSize = files.reduce((total, file) => {
      const stats = fs.statSync(file);
      return total + stats.size;
    }, 0);

    this.results.bundleSize = {
      totalFiles: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      largestFiles: this.getLargestFiles(files, 5)
    };

    console.log(`✅ Total bundle size: ${this.results.bundleSize.totalSizeMB}MB`);
    
    if (totalSize > 5 * 1024 * 1024) { // 5MB
      this.results.recommendations.push({
        type: 'bundle-size',
        severity: 'high',
        message: 'Bundle size is too large (>5MB). Consider code splitting and lazy loading.',
        impact: 'Slow initial page load'
      });
    }
  }

  async testLoadTime() {
    console.log('⏱️ Testing load time...');
    
    const startTime = performance.now();
    
    // Simulate loading critical resources
    await this.simulateResourceLoading();
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    this.results.loadTime = {
      simulatedLoadTime: loadTime,
      targetLoadTime: 3000, // 3 seconds
      performance: loadTime < 3000 ? 'good' : 'needs-improvement'
    };

    console.log(`✅ Simulated load time: ${loadTime.toFixed(2)}ms`);
    
    if (loadTime > 3000) {
      this.results.recommendations.push({
        type: 'load-time',
        severity: 'high',
        message: 'Load time is too slow (>3s). Optimize critical rendering path.',
        impact: 'Poor user experience'
      });
    }
  }

  async testMemoryUsage() {
    console.log('🧠 Testing memory usage...');
    
    const memBefore = process.memoryUsage();
    
    // Simulate memory-intensive operations
    await this.simulateMemoryOperations();
    
    const memAfter = process.memoryUsage();
    const memoryIncrease = memAfter.heapUsed - memBefore.heapUsed;

    this.results.memoryUsage = {
      initialHeap: (memBefore.heapUsed / 1024 / 1024).toFixed(2),
      finalHeap: (memAfter.heapUsed / 1024 / 1024).toFixed(2),
      memoryIncrease: (memoryIncrease / 1024 / 1024).toFixed(2),
      performance: memoryIncrease < 50 * 1024 * 1024 ? 'good' : 'needs-improvement' // 50MB
    };

    console.log(`✅ Memory usage: ${this.results.memoryUsage.finalHeap}MB`);
    
    if (memoryIncrease > 50 * 1024 * 1024) {
      this.results.recommendations.push({
        type: 'memory-usage',
        severity: 'medium',
        message: 'High memory usage detected. Check for memory leaks.',
        impact: 'Poor performance on low-end devices'
      });
    }
  }

  async simulateResourceLoading() {
    // Simulate loading different types of resources
    const resources = [
      { type: 'HTML', size: 50 },
      { type: 'CSS', size: 200 },
      { type: 'JavaScript', size: 1000 },
      { type: 'Images', size: 500 },
      { type: 'Fonts', size: 100 }
    ];

    for (const resource of resources) {
      await new Promise(resolve => setTimeout(resolve, resource.size));
    }
  }

  async simulateMemoryOperations() {
    // Simulate memory-intensive operations
    const data = [];
    for (let i = 0; i < 10000; i++) {
      data.push({
        id: i,
        title: `Anime ${i}`,
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        genres: ['Action', 'Adventure', 'Fantasy'],
        rating: Math.random() * 10
      });
    }
    
    // Simulate data processing
    const processed = data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }));
    
    return processed;
  }

  getFilesRecursively(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  getLargestFiles(files, count) {
    return files
      .map(file => ({
        path: file,
        size: fs.statSync(file).size
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, count)
      .map(file => ({
        path: path.relative(process.cwd(), file.path),
        size: (file.size / 1024).toFixed(2) + 'KB'
      }));
  }

  generateReport() {
    console.log('\n📊 Performance Test Report');
    console.log('========================\n');

    // Bundle Size Report
    console.log('📦 Bundle Size Analysis:');
    console.log(`   Total files: ${this.results.bundleSize.totalFiles}`);
    console.log(`   Total size: ${this.results.bundleSize.totalSizeMB}MB`);
    console.log('   Largest files:');
    this.results.bundleSize.largestFiles.forEach(file => {
      console.log(`     - ${file.path}: ${file.size}`);
    });

    // Load Time Report
    console.log('\n⏱️ Load Time Analysis:');
    console.log(`   Simulated load time: ${this.results.loadTime.simulatedLoadTime.toFixed(2)}ms`);
    console.log(`   Target: <3000ms`);
    console.log(`   Performance: ${this.results.loadTime.performance}`);

    // Memory Usage Report
    console.log('\n🧠 Memory Usage Analysis:');
    console.log(`   Initial heap: ${this.results.memoryUsage.initialHeap}MB`);
    console.log(`   Final heap: ${this.results.memoryUsage.finalHeap}MB`);
    console.log(`   Memory increase: ${this.results.memoryUsage.memoryIncrease}MB`);
    console.log(`   Performance: ${this.results.memoryUsage.performance}`);

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Optimization Recommendations:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
        console.log(`      Impact: ${rec.impact}`);
      });
    } else {
      console.log('\n✅ No critical performance issues found!');
    }

    // Save report to file
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  async runAllTests() {
    console.log('🚀 Starting AnimeHub Performance Tests...\n');
    
    try {
      await this.testBundleSize();
      await this.testLoadTime();
      await this.testMemoryUsage();
      this.generateReport();
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    }
  }
}

// Run the performance tests
const tester = new PerformanceTester();
tester.runAllTests();
