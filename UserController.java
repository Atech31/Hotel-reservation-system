  package com.infotact.reservation.controller;

import com.infotact.reservation.model.User;
import com.infotact.reservation.repository.UserRepository;
import com.infotact.reservation.security.JwtUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    // Constructor injection (Best practice!)
    public UserController(UserRepository userRepository, 
                          PasswordEncoder passwordEncoder, 
                          AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }

    /**
     * 📝 USER REGISTRATION
     * POST http://localhost:8082/api/users/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        // 1. Check if the email is already registered
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Error: Email is already registered!");
        }

        // 2. Encrypt the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // 3. Set default role if null
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("ROLE_CUSTOMER");
        }

        // 4. Save user to PostgreSQL database
        User savedUser = userRepository.save(user);
        savedUser.setPassword(null); // Clear password from response for safety
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    /**
     * 🔑 USER LOGIN
     * POST http://localhost:8082/api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        try {
            // 1. Authenticate via Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 2. Fetch user from database
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();

                // 3. Generate JWT Token
                String token = jwtUtils.generateToken(user.getEmail(), user.getRole());

                // 4. Return token alongside user details
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("id", user.getId());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("role", user.getRole());

                return ResponseEntity.ok(response);
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: User details not found!");

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Error: Invalid email or password!");
        }
    }
}
