  package com.infotact.reservation.service;

import com.infotact.reservation.booking.Booking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendBookingConfirmation(Booking booking) {
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Pass 'true' for multipart (required for attachments)
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String roomNo = (booking.getRoom() != null) ? String.valueOf(booking.getRoom().getRoomNumber()) : "N/A";
            String paymentId = (booking.getRazorpayPaymentId() != null) ? booking.getRazorpayPaymentId() : "N/A";
            String guestName = (booking.getCustomerName() != null) ? booking.getCustomerName() : "Valued Guest";
            
            // Extract recipient email from booking object
            String recipientEmail = (booking.getCustomerEmail() != null) ? booking.getCustomerEmail() : "guest@example.com";

            // Set email recipient & subject
            helper.setTo(recipientEmail);
            helper.setSubject("Booking Confirmation - Luxury Stay Hotel");

            // 1. Customized HTML Body
            String htmlBody = """
                <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0f172a; padding: 30px; color: #f8fafc;">
                    <div style="max-width: 550px; background: #1e293b; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 25px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">🏢 Luxury Stay Hotel</h1>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #bfdbfe;">Reservation & Payment Confirmed</p>
                        </div>
                        <div style="padding: 25px; color: #cbd5e1;">
                            <p style="font-size: 16px;">Dear <strong style="color: #ffffff;">%s</strong>,</p>
                            <p style="line-height: 1.5; color: #94a3b8;">Thank you for your reservation! Your payment has been successfully processed, and your room is reserved.</p>
                            
                            <div style="background: #0f172a; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #334155;">
                                <table style="width: 100%%; border-collapse: collapse; font-size: 14px;">
                                    <tr><td style="padding: 8px 0; color: #94a3b8;">Booking ID:</td><td style="text-align: right; color: #ffffff; font-weight: bold;">#%d</td></tr>
                                    <tr><td style="padding: 8px 0; color: #94a3b8;">Payment ID:</td><td style="text-align: right; color: #60a5fa; font-weight: bold;">%s</td></tr>
                                    <tr><td style="padding: 8px 0; color: #94a3b8;">Room Reserved:</td><td style="text-align: right; color: #ffffff; font-weight: bold;">Room %s</td></tr>
                                    <tr><td style="padding: 8px 0; color: #94a3b8;">Check-In Date:</td><td style="text-align: right; color: #4ade80;">%s</td></tr>
                                    <tr><td style="padding: 8px 0; color: #94a3b8;">Check-Out Date:</td><td style="text-align: right; color: #f87171;">%s</td></tr>
                                </table>
                            </div>

                            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 20px;">
                                📎 <em>Your official receipt text file has been attached to this email for your records.</em>
                            </p>
                        </div>
                    </div>
                </div>
            """.formatted(guestName, booking.getId(), paymentId, roomNo, booking.getCheckInDate(), booking.getCheckOutDate());

            helper.setText(htmlBody, true);

            // 2. Generate and Attach Receipt File
            String receiptContent = String.format("""
                ========================================
                       LUXURY STAY HOTEL - RECEIPT      
                ========================================
                Booking ID    : #%d
                Payment ID    : %s
                Guest Name    : %s
                Guest Email   : %s
                Room          : Room %s
                Check-In      : %s
                Check-Out     : %s
                Status        : CONFIRMED & PAID
                ========================================
                   Thank you for staying with us!       
                ========================================
                """,
                booking.getId(),
                paymentId,
                guestName,
                recipientEmail,
                roomNo,
                booking.getCheckInDate(),
                booking.getCheckOutDate()
            );

            ByteArrayResource attachmentResource = new ByteArrayResource(receiptContent.getBytes(StandardCharsets.UTF_8));
            helper.addAttachment("Receipt_Booking_" + booking.getId() + ".txt", attachmentResource);

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Failed to send booking confirmation email: " + e.getMessage());
        }
    }
}
