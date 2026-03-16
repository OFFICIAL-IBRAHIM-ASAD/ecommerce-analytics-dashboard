# ==========================================
# STAGE 1: Build the Application
# ==========================================
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy the Maven wrapper and pom.xml first (for caching dependencies)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Fix Windows line endings in the mvnw script just in case, then download dependencies
RUN sed -i 's/\r$//' mvnw
RUN ./mvnw dependency:go-offline

# Copy the actual source code and build the .jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# ==========================================
# STAGE 2: Run the Application
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy ONLY the built .jar file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the port
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
