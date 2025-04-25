import { Helmet } from "react-helmet";

export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Terms and Conditions | Blue Whale Competitions</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      
      <div className="prose prose-blue dark:prose-invert max-w-none">
        <p className="lead">Last updated: April 25, 2025</p>
        
        <p>Please read these Terms and Conditions ("Terms") carefully before using Blue Whale Competitions website and services.</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access our services.</p>
        
        <h2>2. Eligibility</h2>
        <p>You must be at least 18 years old and a resident of the United Kingdom to participate in our competitions. We reserve the right to request proof of age and identity at any time.</p>
        
        <h2>3. Competition Entry</h2>
        <p>3.1. Each competition will specify the number of available tickets and the cost per ticket.</p>
        <p>3.2. A purchase of a ticket constitutes your entry into the respective competition.</p>
        <p>3.3. All competition entries are final and non-refundable once purchased.</p>
        <p>3.4. We reserve the right to cancel any competition if the minimum number of tickets is not sold, in which case a full refund will be provided to all entrants.</p>
        
        <h2>4. Winner Selection</h2>
        <p>4.1. Winners will be selected randomly using a verifiable random number generator.</p>
        <p>4.2. The winner will be notified via the contact details provided during registration.</p>
        <p>4.3. If a winner cannot be contacted or does not claim the prize within 14 days, we reserve the right to withdraw the prize and select a replacement winner.</p>
        
        <h2>5. Prizes</h2>
        <p>5.1. Prizes are as described in each competition listing.</p>
        <p>5.2. Prizes are non-transferable and no cash alternative is available.</p>
        <p>5.3. We reserve the right to substitute any prize with another of equivalent value without notice.</p>
        
        <h2>6. User Accounts</h2>
        <p>6.1. You are responsible for maintaining the confidentiality of your account credentials.</p>
        <p>6.2. You are responsible for all activities that occur under your account.</p>
        <p>6.3. We reserve the right to terminate accounts if we suspect fraudulent activity.</p>
        
        <h2>7. Payment</h2>
        <p>7.1. All payments are processed securely through Stripe.</p>
        <p>7.2. All prices are listed in British Pounds (£) and include VAT where applicable.</p>
        
        <h2>8. Limitation of Liability</h2>
        <p>8.1. We shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of our services.</p>
        <p>8.2. Our total liability shall not exceed the amount paid by you for the specific competition entry in question.</p>
        
        <h2>9. Modifications</h2>
        <p>We reserve the right to modify these Terms at any time. Your continued use of our services after such modifications constitutes your acceptance of the updated Terms.</p>
        
        <h2>10. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of the United Kingdom.</p>
        
        <h2>11. Contact Information</h2>
        <p>For any questions about these Terms, please contact us at support@bluewhalecompetitions.co.uk.</p>
      </div>
    </div>
  );
}