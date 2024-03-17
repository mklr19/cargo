# My Cargonaut

MyCargonaut is a platform that allows users to organize and manage ridesharing and freight transportation.

## Getting Started

These instructions will help you set up and run the application on your local machine.

### Prerequisites

Make sure you have the following installed on your system:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 

### Installation

1. Clone the repository to your local machine:

    ```bash
    git clone https://git.thm.de/lsan07/my-cargonaut.git
    ```

2. Navigate to the project directory:

    ```bash
    cd your_path/my-cargonaut
    ```

### Running the Application

Execute the following command in your terminal to start/build the application:

```bash
docker compose up --build
```
Docker will create the App and Database including all dependencies.
After a couple of tries the App will connect to the Database.
Once it says "Erfolgreich mit der Datenbank verbunden", you can run the App by opening http://localhost:3005/ on your browser.

### First Step after your build

We included some Data and Users so you can already see some features.
Use the following Login Credentials:
- **Benutzername**: test
- **Passwort**: test

### Important Files and Folder
- **init.sql**: This is the initial SQL Dump to create the Database.
- **Dokumentation**: Folder which includes all Mockups and Diagrams.
- **postgres-db**: This Folder includes the database, it will show up after the inital build.
