module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    ts: {
      app: {
        files: [{
          src: ["src/**/*.ts", "!src/.baseDir.ts", "!src/_all.d.ts"],
          dest: "out"
        }],
        options: {
          module: "commonjs",
//          noLib: true,
          target: "es5",
          sourceMap: false
        }
      }
    },
    tslint: {
      options: {
        configuration: "tslint.json"
      },
      files: {
        src: ["src/**/*.ts"]
      }
    },
    watch: {
      ts: {
        files: ["js/src/**/*.ts", "src/**/*.ts"],
        tasks: ["ts", "tslint"]
      }
    }
  });
        
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks("grunt-contrib-sass");
      
  grunt.registerTask("default", [
    "ts",
    "tslint"
  ]);
}
