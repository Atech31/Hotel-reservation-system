  package com.infotact.reservation.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.infotact.reservation.model.Room;
import com.infotact.reservation.repository.RoomRepository;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody Room room) {
        // Prevent duplicate room numbers
        if (roomRepository.existsByRoomNumber(room.getRoomNumber())) {
            return ResponseEntity.badRequest().body("Room number already exists!");
        }
        room.setAvailable(true);
        Room savedRoom = roomRepository.save(room);
        return ResponseEntity.ok(savedRoom);
    }
}
