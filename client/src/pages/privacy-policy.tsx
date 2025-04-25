import { Helmet } from "react-helmet";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Privacy Policy | Blue Whale Competitions</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose prose-blue dark:prose-invert max-w-none">
        <p className="lead">Last updated: April 25, 2025</p>
        
        <p>Blue Whale Competitions ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>
        
        <h2>1. Information We Collect</h2>
        
        <h3>1.1 Personal Information</h3>
        <p>We may collect personal information that you voluntarily provide to us when you:</p>
        <ul>
          <li>Register for an account</li>
          <li>Purchase competition tickets</li>
          <li>Subscribe to our newsletter</li>
          <li>Contact our customer service</li>
          <li>Participate in promotions or surveys</li>
        </ul>
        <p>This information may include:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Postal address</li>
          <li>Phone number</li>
          <li>Date of birth</li>
          <li>Payment information (processed securely via our payment processor)</li>
        </ul>
        
        <h3>1.2 Automatically Collected Information</h3>
        <p>When you access our website, we may automatically collect certain information about your device and usage, including:</p>
        <ul>
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>Pages visited and time spent</li>
          <li>Referral sources</li>
          <li>Device information</li>
        </ul>
        
        <h2>2. How We Use Your Information</h2>
        <p>We may use the information we collect for various purposes, including to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Process your competition entries and payments</li>
          <li>Notify you about competition results</li>
          <li>Send you promotional emails (if you have opted in)</li>
          <li>Respond to your inquiries and provide customer support</li>
          <li>Improve our website and services</li>
          <li>Comply with legal obligations</li>
          <li>Detect and prevent fraudulent activity</li>
        </ul>
        
        <h2>3. How We Share Your Information</h2>
        <p>We may share your information with:</p>
        <ul>
          <li>Payment processors to complete transactions</li>
          <li>Service providers who assist in our operations</li>
          <li>Legal authorities when required by law</li>
          <li>Professional advisors such as lawyers, auditors, and insurers</li>
        </ul>
        <p>We will never sell your personal information to third parties for marketing purposes.</p>
        
        <h2>4. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        <p>However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
        
        <h2>5. Your Rights</h2>
        <p>Under applicable data protection laws, you may have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Object to processing of your information</li>
          <li>Request restriction of processing</li>
          <li>Request transfer of your information</li>
          <li>Withdraw consent at any time</li>
        </ul>
        
        <h2>6. Cookies</h2>
        <p>We use cookies and similar tracking technologies to enhance your browsing experience. For more information, please see our Cookie Policy.</p>
        
        <h2>7. Third-Party Links</h2>
        <p>Our website may contain links to third-party websites. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>
        
        <h2>8. Children's Privacy</h2>
        <p>Our services are not intended for individuals under the age of 18, and we do not knowingly collect personal information from children.</p>
        
        <h2>9. Changes to This Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
        
        <h2>10. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>Email: privacy@bluewhalecompetitions.co.uk</p>
        <p>Address: 123 Competition Street, London, UK</p>
      </div>
    </div>
  );
}