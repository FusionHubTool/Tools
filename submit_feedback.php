<!DOCTYPE html>
<html>
<head>
    <title>Feedback Received</title>
</head>
<body>
    <h1>Feedback Received</h1>
    
    <?php
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $name = $_POST["name"];
        $email = $_POST["email"];
        $feedback = $_POST["feedback"];

        // You can save the feedback data to a database or file here if needed.
        // For this example, we'll just display it on the next page.
    ?>

    <p><strong>Name:</strong> <?php echo $name; ?></p>
    <p><strong>Email:</strong> <?php echo $email; ?></p>
    <p><strong>Feedback:</strong> <?php echo $feedback; ?></p>

    <?php
    } else {
        echo "Invalid Request";
    }
    ?>

    <a href="index.html">Go back to the feedback form</a>
</body>
</html>
