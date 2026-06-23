<?php
/**
 * Traitement du formulaire de contact - envoi via mail() OVH
 *
 * IMPORTANT : sur OVH mutualisé, l'expediteur (From) DOIT etre une adresse
 * du domaine herberge, sinon le mail est rejete. Ici : contact@kiliankwiczor.com
 */

$DESTINATAIRE = 'kilianlamare@gmail.com';
$EXPEDITEUR   = 'contact@kiliankwiczor.com';
$REDIRECT_OK  = 'contact.html?sent=1';
$REDIRECT_KO  = 'contact.html?error=1';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $REDIRECT_KO);
    exit;
}

if (!empty($_POST['website'])) {
    header('Location: ' . $REDIRECT_OK);
    exit;
}

$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    header('Location: ' . $REDIRECT_KO);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ' . $REDIRECT_KO);
    exit;
}

if (preg_match('/[\r\n]/', $name) || preg_match('/[\r\n]/', $email)) {
    header('Location: ' . $REDIRECT_KO);
    exit;
}

if (mb_strlen($message) > 5000 || mb_strlen($name) > 200) {
    header('Location: ' . $REDIRECT_KO);
    exit;
}

$sujet = '[kiliankwiczor.com] Nouveau message de ' . $name;

$corps  = "Nouveau message recu via le formulaire de contact.\n";
$corps .= "----------------------------------------\n\n";
$corps .= "Nom    : " . $name . "\n";
$corps .= "Email  : " . $email . "\n\n";
$corps .= "Message :\n" . $message . "\n\n";
$corps .= "----------------------------------------\n";
$corps .= "Envoye le " . date('d/m/Y H:i:s') . "\n";

$headers  = "From: Site kiliankwiczor.com <" . $EXPEDITEUR . ">\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "Return-Path: " . $EXPEDITEUR . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$envoye = @mail($DESTINATAIRE, $sujet, $corps, $headers, '-f' . $EXPEDITEUR);

if ($envoye) {
    header('Location: ' . $REDIRECT_OK);
} else {
    header('Location: ' . $REDIRECT_KO);
}
exit;
