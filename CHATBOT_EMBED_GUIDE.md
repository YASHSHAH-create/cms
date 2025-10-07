# 🤖 Envirocare Labs Chatbot - WordPress Embed Guide

## Quick Start

Your chatbot is now ready to be embedded on WordPress! You have 3 options:

---

## 📱 Option 1: Floating Chat Widget (Recommended)

### What it does:
Adds a floating chat button in the bottom-right corner of your WordPress site (like WhatsApp).

### Installation Steps:

1. **Copy this code:**

```html
<!-- Envirocare Labs Chatbot Widget -->
<script>
  (function() {
    // Create chatbot toggle button
    var chatButton = document.createElement('button');
    chatButton.id = 'envirocare-chat-btn';
    chatButton.innerHTML = '<svg style="width:24px;height:24px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>';
    chatButton.style.cssText = 'position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#2d4891,#1e3a8a);color:white;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;z-index:9998;display:flex;align-items:center;justify-content:center;transition:all 0.3s ease;';
    
    // Create iframe container
    var iframeContainer = document.createElement('div');
    iframeContainer.id = 'envirocare-chat-container';
    iframeContainer.style.cssText = 'position:fixed;bottom:100px;right:24px;width:400px;height:600px;border:none;border-radius:20px;box-shadow:0 8px 30px rgba(0,0,0,0.2);z-index:9999;display:none;overflow:hidden;';
    
    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = 'YOUR_DOMAIN/chatbot/iframe';
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:20px;';
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
    
    iframeContainer.appendChild(iframe);
    document.body.appendChild(chatButton);
    document.body.appendChild(iframeContainer);
    
    // Toggle chatbot
    var isOpen = false;
    chatButton.addEventListener('click', function() {
      isOpen = !isOpen;
      iframeContainer.style.display = isOpen ? 'block' : 'none';
      chatButton.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)';
    });
    
    // Hover effect
    chatButton.addEventListener('mouseenter', function() {
      if (!isOpen) this.style.transform = 'scale(1.1)';
    });
    chatButton.addEventListener('mouseleave', function() {
      if (!isOpen) this.style.transform = 'scale(1)';
    });

    // Mobile responsive
    if (window.innerWidth < 768) {
      iframeContainer.style.cssText = 'position:fixed;bottom:0;right:0;left:0;top:0;width:100%;height:100%;border:none;border-radius:0;box-shadow:none;z-index:9999;display:none;';
    }
  })();
</script>
```

2. **Replace `YOUR_DOMAIN`** with your actual website URL (e.g., `https://yourdomain.com`)

3. **Add to WordPress:**
   - Go to **WordPress Admin** → **Appearance** → **Theme File Editor**
   - Click on **footer.php**
   - Paste the code **before** the closing `</body>` tag
   - Click **Update File**

**OR** Use a plugin:
   - Install **"Insert Headers and Footers"** plugin
   - Go to **Settings** → **Insert Headers and Footers**
   - Paste the code in the **Footer** section
   - Save

---

## 📦 Option 2: Embedded Chatbot

### What it does:
Embeds the chatbot directly into a specific page or post.

### Installation Steps:

1. **Copy this code:**

```html
<!-- Envirocare Labs Chatbot Embed -->
<div style="width:100%;max-width:500px;height:700px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.15);">
  <iframe 
    src="YOUR_DOMAIN/chatbot/iframe" 
    style="width:100%;height:100%;border:none;" 
    allow="clipboard-read; clipboard-write"
    title="Envirocare Labs Chatbot">
  </iframe>
</div>
```

2. **Replace `YOUR_DOMAIN`** with your actual website URL

3. **Add to WordPress Page:**
   - Edit any page or post
   - Click the **+** button to add a new block
   - Search for **"Custom HTML"**
   - Paste the code
   - Update/Publish the page

---

## 🔌 Option 3: Shortcode (Advanced)

### What it does:
Create a reusable WordPress shortcode for the chatbot.

### Installation Steps:

1. **Add this to your theme's `functions.php`:**

```php
function envirocare_chatbot_shortcode() {
    $domain = get_site_url(); // Automatically uses your WordPress domain
    return '<div style="width:100%;max-width:500px;height:700px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.15);">
        <iframe 
            src="' . $domain . '/chatbot/iframe" 
            style="width:100%;height:100%;border:none;" 
            allow="clipboard-read; clipboard-write"
            title="Envirocare Labs Chatbot">
        </iframe>
    </div>';
}
add_shortcode('envirocare_chatbot', 'envirocare_chatbot_shortcode');
```

2. **Use in any page/post:**

Simply add this shortcode:
```
[envirocare_chatbot]
```

---

## 🎨 Customization

### Change Position (Floating Widget):
```javascript
// Bottom-left corner:
bottom:24px;left:24px;

// Top-right corner:
top:24px;right:24px;
```

### Change Size (Embedded):
```html
<!-- Larger -->
<div style="width:100%;max-width:700px;height:800px;...">

<!-- Smaller -->
<div style="width:100%;max-width:400px;height:600px;...">

<!-- Full width -->
<div style="width:100%;height:700px;...">
```

### Change Colors:
```javascript
// Update gradient:
background:linear-gradient(135deg,#YOUR_COLOR_1,#YOUR_COLOR_2);
```

---

## 🔧 Troubleshooting

### Chatbot not showing?
- ✅ Verify you replaced `YOUR_DOMAIN`
- ✅ Clear browser cache and WordPress cache
- ✅ Check browser console for JavaScript errors (F12)
- ✅ Ensure JavaScript is enabled

### Chatbot shows but doesn't work?
- ✅ Make sure your site uses HTTPS
- ✅ Check if cookies are enabled
- ✅ Verify the iframe URL is accessible

### Mobile issues?
- ✅ The floating widget automatically becomes full-screen on mobile
- ✅ For embedded, ensure parent container is responsive

---

## 📱 Mobile Responsive

Both floating and embedded options are fully responsive:
- **Desktop:** Normal size with hover effects
- **Tablet:** Adjusted sizing
- **Mobile:** Full-screen modal experience

---

## 🚀 Testing

1. Visit: `YOUR_DOMAIN/chatbot/iframe` to test the chatbot directly
2. Access the embed guide: `YOUR_DOMAIN/chatbot-embed.html`

---

## 💬 Support

Need help? Contact us:
- 📧 Email: support@envirocarelabs.com
- 📞 Phone: +1 (555) 123-4567
- 🌐 Website: https://envirocarelabs.com

---

## ✨ Features

- ✅ AI-powered conversations
- ✅ Service selection flow
- ✅ Lead capture & enquiry management
- ✅ Mobile responsive
- ✅ Beautiful modern UI
- ✅ FAQ & Articles sections
- ✅ Real-time chat history
- ✅ Multi-country phone support

---

## 🎯 Best Practices

1. **For all pages:** Use Option 1 (Floating Widget)
2. **For contact page:** Use Option 2 (Embedded)
3. **For flexibility:** Use Option 3 (Shortcode)

---

## 📊 Analytics

All chatbot interactions are tracked in your admin dashboard:
- Visitor information
- Conversation history
- Service interests
- Enquiry management

---

**Happy Chatting! 🎉**

