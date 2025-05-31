<?php
// Initialisation du tableau
$instance = array();
$instance['Bloodaria'] = array();

$instance['Bloodaria'] = array_merge($instance['Bloodaria'], array(
    "loadder" => array(
        "minecraft_version" => "1.12.2",
        "loadder_type" => "forge",
        "loadder_version" => "1.12.2-14.23.5.2859"
    ),
    "verify" => true,
    "ignored" => array(
        'config',
        'options.txt',
        'logs',
        'saves',
        'screenshots',
        'resourcepacks',
        'shaderpacks',
        'optionsof.txt'
    ),
    "whitelist" => array(),
    "whitelistActive" => false,
    "status" => array(
        "nameServer" => "Bloodaria",
        "ip" => "play.bloodariamc.fr" ,
        "port" => 25662
    )
));
?>