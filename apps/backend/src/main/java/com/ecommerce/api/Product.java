package com.ecommerce.api;

import jakarta.persistence.*;
import lombok.Data;

@Data // Lombok automatically generates Getters and Setters for us!
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Double price;
    private String category;
}