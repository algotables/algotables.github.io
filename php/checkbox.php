<?php
 
/*
 * Example PHP implementation used for the checkbox.html example
 */
 
// DataTables PHP library
include( "../lib/DataTables.php" );
 
// Alias Editor classes so they are easy to use
use
    DataTables\Editor,
    DataTables\Editor\Field,
    DataTables\Editor\Format,
    DataTables\Editor\Mjoin,
    DataTables\Editor\Options,
    DataTables\Editor\Upload,
    DataTables\Editor\Validate,
    DataTables\Editor\ValidateOptions;
 
// Build our Editor instance and process the data coming from _POST
Editor::inst( $db, 'users' )
    ->fields(
        Field::inst( 'first_name' ),
        Field::inst( 'last_name' ),
        Field::inst( 'phone' ),
        Field::inst( 'city' ),
        Field::inst( 'zip' ),
        Field::inst( 'active' )
            ->setFormatter( function ( $val, $data, $opts ) {
                return ! $val ? 0 : 1;
            } )
    )
    ->process( $_POST )
    ->json();