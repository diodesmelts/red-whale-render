import { Helmet } from "react-helmet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQsPage() {
  return (
    <>
      <Helmet>
        <title>Blue Whale Competitions | Frequently Asked Questions</title>
        <meta
          name="description"
          content="Find answers to frequently asked questions about Blue Whale Competitions - how it works, payments, prize delivery and more."
        />
      </Helmet>

      <div className="container py-12 max-w-4xl relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 right-10 w-64 h-64 bg-[#7B39ED]/5 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-40 left-10 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute top-1/4 left-1/3 w-5 h-5 bg-yellow-400/20 rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-green-400/20 rounded-full"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h1>
          <p className="text-center text-muted-foreground mb-10">
            Find answers to the most common questions about Blue Whale Competitions.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">How do your competitions work?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  Blue Whale Competitions works on a simple ticket system. Here's how it works:
                </p>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Browse our available competitions and find something you'd like to win</li>
                  <li>Purchase one or more tickets for that competition</li>
                  <li>Each ticket gives you one entry into the prize draw</li>
                  <li>When the competition reaches its end date or sells out, a winner is drawn at random</li>
                  <li>If you win, we'll contact you immediately to arrange delivery of your prize</li>
                </ol>
                <p className="mt-4">
                  Every ticket also includes a free entry into our monthly bonus prize draw, giving you even more chances to win!
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">How are winners selected?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Winners are selected through a completely fair and random process. When a competition ends, our system generates a random number that corresponds to one of the tickets sold. The person who bought that ticket is the winner. If required by the competition's terms, we may use a third-party verification service to ensure complete transparency.
                </p>
                <p className="mt-4">
                  All draws are recorded and the results are published on our website. Winners are notified immediately via email and phone (if provided).
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">How do I claim my prize if I win?</AccordionTrigger>
              <AccordionContent>
                <p>
                  If you're lucky enough to win, we'll contact you directly using the email address and phone number you provided during registration. You'll receive instructions on how to claim your prize, which may involve:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-2">
                  <li>Providing proof of identity</li>
                  <li>Confirming your delivery address</li>
                  <li>Arranging a convenient delivery time</li>
                </ul>
                <p className="mt-4">
                  For physical prizes, we handle all delivery arrangements and costs. For cash prizes, we'll coordinate the transfer to your preferred bank account or payment method.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                <p>
                  We accept all major credit and debit cards including Visa, Mastercard, and American Express. We also support Apple Pay for a faster checkout experience. All payments are processed securely through Stripe, a leading payment processor that ensures your financial information is kept safe and secure.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">How do I know if a competition is still open?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Each competition displays its current status clearly. You'll see either:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-2">
                  <li><span className="text-green-500 font-medium">Open</span> - Still accepting entries, with tickets available</li>
                  <li><span className="text-yellow-500 font-medium">Ending Soon</span> - Less than 48 hours remaining or 90% of tickets sold</li>
                  <li><span className="text-red-500 font-medium">Closed</span> - No longer accepting entries, draw pending</li>
                  <li><span className="text-blue-500 font-medium">Completed</span> - Draw has taken place and winner has been notified</li>
                </ul>
                <p className="mt-4">
                  You can only purchase tickets for competitions that are marked as "Open" or "Ending Soon".
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg font-medium">Can I get a refund on my tickets?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Due to the nature of competitions, we generally do not offer refunds on purchased tickets. However, we may consider refunds in exceptional circumstances, such as:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-2">
                  <li>If the competition is canceled by us</li>
                  <li>If there was a technical error during purchase</li>
                  <li>In cases of duplicate transactions</li>
                </ul>
                <p className="mt-4">
                  If you believe you're entitled to a refund, please contact our customer support team within 14 days of your purchase with your order number and reason for requesting a refund.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg font-medium">How do I check my ticket numbers?</AccordionTrigger>
              <AccordionContent>
                <p>
                  You can view all your active and past tickets in the "My Entries" section of your account. This shows:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-2">
                  <li>Competitions you've entered</li>
                  <li>How many tickets you purchased for each</li>
                  <li>Your ticket numbers</li>
                  <li>The status of each competition</li>
                  <li>Results once the draw has taken place</li>
                </ul>
                <p className="mt-4">
                  We also send confirmation emails after each purchase with your ticket details for your records.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger className="text-lg font-medium">What happens if I win but can't be contacted?</AccordionTrigger>
              <AccordionContent>
                <p>
                  If you win, we'll make several attempts to contact you using the information you provided when setting up your account. We recommend keeping your contact details up-to-date.
                </p>
                <p className="mt-2">
                  We'll try to reach you for up to 14 days after the draw. If we can't make contact after this period, we may need to redraw and select another winner, in accordance with our terms and conditions.
                </p>
                <p className="mt-2">
                  To avoid missing out, please ensure your email and phone number are correct in your account settings, and check your spam/junk folders regularly.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-9">
              <AccordionTrigger className="text-lg font-medium">Are there age restrictions for entering competitions?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Yes, you must be at least 18 years old to create an account and enter our competitions. This is verified during the registration process and we may require proof of age before delivering prizes.
                </p>
                <p className="mt-4">
                  Some specific competitions may have additional age requirements, particularly those involving alcohol, driving experiences, or other age-restricted activities. These additional requirements will be clearly stated in the competition details.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-10">
              <AccordionTrigger className="text-lg font-medium">How do I contact customer support?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Our customer support team is available to help with any questions or concerns you might have. You can reach us through:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-2">
                  <li><span className="font-medium">Email:</span> support@bluewhalecompetitions.co.uk</li>
                  <li><span className="font-medium">Phone:</span> 0800 123 4567 (Mon-Fri, 9am-5pm)</li>
                  <li><span className="font-medium">Live Chat:</span> Available on our website during business hours</li>
                  <li><span className="font-medium">Contact Form:</span> Available on our Contact page</li>
                </ul>
                <p className="mt-4">
                  We aim to respond to all inquiries within 24 hours during business days.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Didn't find what you were looking for? 
              <a href="/contact" className="text-primary font-medium ml-1 hover:underline">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}