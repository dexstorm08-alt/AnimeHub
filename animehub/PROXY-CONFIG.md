# Proxy Configuration for API + HTTP Scraper

## 🔧 **Proxy Setup**

To use residential proxies for CloudFlare bypass, add these to your `.env.local` file:

```bash
# Enable proxy support
PROXY_ENABLED=true

# Add your proxy servers (comma-separated)
PROXY_SERVERS=proxy1.example.com:8080,proxy2.example.com:8080,proxy3.example.com:8080

# Proxy rotation (optional)
PROXY_ROTATION=true
```

## 🌐 **Recommended Proxy Providers**

### **Residential Proxies (Best for CloudFlare)**
- **Bright Data** - Premium residential proxies
- **Oxylabs** - High-quality residential IPs
- **Smartproxy** - Affordable residential proxies
- **ProxyMesh** - Rotating residential proxies

### **Datacenter Proxies (Faster, cheaper)**
- **ProxyRack** - Datacenter proxies
- **Storm Proxies** - Rotating datacenter IPs
- **Proxy-Seller** - Budget-friendly options

## 🚀 **Usage Examples**

### **Without Proxies (Default)**
```bash
npm run scrape-api-http
```

### **With Proxies**
1. Add proxy configuration to `.env.local`
2. Run the scraper:
```bash
npm run scrape-api-http
```

## 📊 **Proxy Benefits**

- ✅ **CloudFlare Bypass** - Residential IPs avoid detection
- ✅ **Rate Limit Avoidance** - Rotate IPs to prevent blocks
- ✅ **Geographic Diversity** - Access region-locked content
- ✅ **Reliability** - Multiple fallback IPs

## 🔧 **Configuration Options**

### **Basic Setup**
```bash
PROXY_ENABLED=true
PROXY_SERVERS=proxy1:8080,proxy2:8080
```

### **Advanced Setup**
```bash
PROXY_ENABLED=true
PROXY_SERVERS=proxy1:8080:username:password,proxy2:8080:username:password
PROXY_ROTATION=true
PROXY_TIMEOUT=30000
```

## 🎯 **Testing Without Proxies**

The scraper will work without proxies but may encounter:
- CloudFlare protection
- Rate limiting
- IP blocking

For testing, you can run without proxies and use the fallback mechanisms.




