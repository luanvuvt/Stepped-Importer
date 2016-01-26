<?php
/*
Plugin Name: Stepped Importer
Plugin URI: http://wordpress.org/plugins/stepped-importer/
Description: This is not just a plugin, it symbolizes the hope and enthusiasm of an entire generation summed up in two words sung most famously by Louis Armstrong: Hello, Dolly. When activated you will randomly see a lyric from <cite>Hello, Dolly</cite> in the upper right of your admin screen on every page.
Author: ThemeMove
Version: 1.0
Author URI: http://thememove.com/
*/
define( 'STEPPED_IMPORTER_URL', plugins_url( '', __FILE__ )  );
define( 'STEPPED_IMPORTER_PATH', plugin_dir_path( __FILE__ )  );

add_action( 'admin_menu', 'stepped_importer_register_menu' );

function stepped_importer_register_menu() {

	add_menu_page( 'Stepped Importer', 'Stepped Importer', 'manage_options', 'stepped_importer', 'stepped_importer_page' );

}

function stepped_importer_page() {
	?>
	<div class="narrow">
		<?php submit_button( __( 'Stepped Importer', 'stepped-importer' ), 'primary large', 'submit', true, array(
			'id' => 'stepped_importer_trigger'
		) ); ?>
		<div id="stepped-importer-results"></div>
	</div>
	<?php
}

function stepped_importer_enqueue_assets() {
	wp_enqueue_script( 'stepped_importer_admin', STEPPED_IMPORTER_URL . '/assets/admin.js', false, '1.0' );
}
add_action( 'admin_enqueue_scripts', 'stepped_importer_enqueue_assets' );

add_action( 'wp_ajax_stepped_import', 'stepped_import_do' );
function stepped_import_do() {
	if ( ! defined( 'WP_LOAD_IMPORTERS' ) ) {
		define( 'WP_LOAD_IMPORTERS', true );
	}

	include_once( STEPPED_IMPORTER_PATH . 'wordpress-importer/wordpress-importer.php' );
	include_once( STEPPED_IMPORTER_PATH . 'wordpress-importer/import-class.php' );

	$import_filepath = STEPPED_IMPORTER_PATH . 'data/content.xml';

	ob_start();
	$wp_import                    = new wpGrade_import();
	$wp_import->fetch_attachments = true;
	$wp_import->import_posts_pages( $import_filepath, $_POST['step_number'], $_POST['number_of_steps'] );
	echo ob_get_contents();
	ob_end_clean();
}