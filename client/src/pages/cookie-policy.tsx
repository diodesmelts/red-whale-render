import { Helmet } from "react-helmet";

export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Cookie Policy | Blue Whale Competitions</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      
      <div className="prose prose-blue dark:prose-invert max-w-none">
        <p className="lead">Last updated: April 25, 2025</p>
        
        <p>This Cookie Policy explains how Blue Whale Competitions ("we", "our", or "us") uses cookies and similar technologies when you visit our website.</p>
        
        <h2>1. What Are Cookies?</h2>
        <p>Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit websites. They are widely used to make websites work more efficiently and provide information to the website owners.</p>
        
        <h2>2. How We Use Cookies</h2>
        <p>We use cookies for various purposes, including to:</p>
        <ul>
          <li>Enable certain functions of the website</li>
          <li>Provide analytics</li>
          <li>Store your preferences</li>
          <li>Enable advertisement delivery</li>
          <li>Enable secure payments and transactions</li>
        </ul>
        
        <h2>3. Types of Cookies We Use</h2>
        
        <h3>3.1 Essential Cookies</h3>
        <p>These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You may disable these by changing your browser settings, but this may affect how the website functions.</p>
        
        <h3>3.2 Analytics Cookies</h3>
        <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and your experience.</p>
        
        <h3>3.3 Functional Cookies</h3>
        <p>These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.</p>
        
        <h3>3.4 Targeting Cookies</h3>
        <p>These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.</p>
        
        <h3>3.5 Session Cookies</h3>
        <p>These are temporary cookies that are deleted when you close your browser. They enable the website to recognize you as you navigate between pages during a single browser session.</p>
        
        <h2>4. Third-Party Cookies</h2>
        <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics, deliver advertisements, and provide other services:</p>
        <ul>
          <li>Google Analytics</li>
          <li>Stripe (for payment processing)</li>
          <li>Social media platforms (when you use social sharing buttons)</li>
        </ul>
        
        <h2>5. Cookie Management</h2>
        <p>Most web browsers allow you to control cookies through their settings. You can:</p>
        <ul>
          <li>Delete cookies from your device</li>
          <li>Block cookies by activating the setting on your browser that allows you to refuse all or some cookies</li>
          <li>Set your browser to notify you when you receive a cookie</li>
        </ul>
        <p>Please note that if you choose to block or delete cookies, some features of our website may not function correctly.</p>
        
        <h3>Managing Cookies in Major Browsers:</h3>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
        
        <h2>6. Changes to This Cookie Policy</h2>
        <p>We may update our Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
        
        <h2>7. Contact Us</h2>
        <p>If you have any questions about our Cookie Policy, please contact us at:</p>
        <p>Email: privacy@bluewhalecompetitions.co.uk</p>
        <p>Address: 123 Competition Street, London, UK</p>
      </div>
    </div>
  );
}