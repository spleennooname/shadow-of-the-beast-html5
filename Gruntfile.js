// Gruntfile.js

// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function

// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {
	grunt.initConfig({
		// get the configuration info from package.json ----------------------------
    	// this way we can use things like name and version (pkg.name)
		pkg: grunt.file.readJSON("package.json"),
	    // configure cssmin to minify css files ------------------------------------
	    uglify: {
	        my_target: {
	          files: {
	            'sotb.min.js': ["game.min.js"]
	          }
	        },
	        dev: {
	          files: {
	            'sotb.min.js': ["src/engine/core.js","src/game/config.js","src/game/main.js"]
	          }
	        }
	    }
	})

	grunt.loadNpmTasks('grunt-contrib-uglify'); 
	//grunt.loadTasks('panda'); 
    grunt.registerTask('ugh', ['uglify']);
    grunt.registerTask('dev', ['uglify:dev']);

    // Default task
    grunt.registerTask('default', ['ugh']);
}
