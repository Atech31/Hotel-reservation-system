package com.infotact.reservation.booking;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infotact.reservation.model.Room;
import com.infotact.reservation.repository.RoomRepository;
import com.infotact.reservation.service.EmailService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final EmailService emailService;

    public BookingController(BookingRepository bookingRepository, RoomRepository roomRepository, EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        if (booking.getRoom() == null || booking.getRoom().getId() == null) {
            return ResponseEntity.badRequest().body("Error: Booking must include a valid room object with an ID.");
        }

        Long targetRoomId = booking.getRoom().getId();

        Optional<Room> roomOpt = roomRepository.findById(targetRoomId);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Room with ID " + targetRoomId + " does not exist.");
        }

        Room room = roomOpt.get();

        if (!room.isAvailable()) {
            return ResponseEntity.badRequest().body("Error: Room " + room.getRoomNumber() + " is already booked/unavailable.");
        }

        booking.setRoom(room);
        Booking savedBooking = bookingRepository.save(booking);

        room.setAvailable(false);
        roomRepository.save(room);

        // Trigger Email
        try {
            emailService.sendBookingConfirmation(savedBooking);
        } catch (Exception e) {
            System.err.println("Email failed to send: " + e.getMessage());
        }

        return ResponseEntity.ok(savedBooking);
    }

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(id);
            
            if (bookingOpt.isPresent()) {
                Booking booking = bookingOpt.get();
                Room room = booking.getRoom();
                
                if (room != null) {
                    room.setAvailable(true);
                    roomRepository.save(room);
                }
                
                bookingRepository.delete(booking);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting booking: " + e.getMessage());
        }
    }
}
