import path from "path";
import gulp from "gulp";
import gutil from "gulp-util";
import notifier from "node-notifier";
import { create as browserSyncCreate } from "browser-sync";
import webpack from "webpack";
import nodeExternals from "webpack-node-externals";
import eslint from "gulp-eslint";
import filter from "gulp-filter";
import rename from "gulp-rename";
import shell from "gulp-shell";
import runSequence from "run-sequence";
import assign from "lodash.assign";

const browserSync = browserSyncCreate();

browserSync.use({
  plugin() {},
  hooks: {
    "client:js":
      '___browserSync___.socket.on("disconnect", window.close.bind(window));'
  }
});

const sharedWebpackConfig = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /dist|public|node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],
  resolve: {
    extensions: [".js", ".jsx"]
  },
  watch: false
};

const libWebpackConfig = assign({}, sharedWebpackConfig, {
  mode: "production",
  entry: path.join(__dirname, "./src/index.js"),
  output: {
    path: path.join(__dirname, "./lib"),
    filename: "react-stonecutter-css.js",
    library: {
      type: 'commonjs-static'
    }
  },
  externals: [nodeExternals()]
});

const demoWebpackConfig = assign({}, sharedWebpackConfig, {
  mode: "none",
  entry: path.join(__dirname, "./demo/src/main.jsx"),
  output: {
    path: path.join(__dirname, "./demo/public"),
    filename: "demo.js"
  }
});

const devCompiler = webpack([libWebpackConfig, demoWebpackConfig]);

gulp.task("webpack", done => {
  let firstTime = true;

  devCompiler.watch(
    {
      aggregateTimeout: 100
    },
    (err, stats) => {
      if (err) {
        notifier.notify({ title: "Webpack Error", message: err });
        throw new gutil.PluginError("webpack", err);
      }

      const jsonStats = stats.toJson();

      if (jsonStats.errors.length > 0) {
        notifier.notify({
          title: "Webpack Error",
          message: jsonStats.errors[0]
        });
      } else if (jsonStats.warnings.length > 0) {
        notifier.notify({
          title: "Webpack Warning",
          message: jsonStats.warnings[0]
        });
      }

      gutil.log(
        gutil.colors.cyan("[webpack]"),
        stats.toString({
          chunks: false,
          version: false,
          colors: true
        })
      );

      browserSync.reload();

      if (firstTime) {
        firstTime = false;
        done();
      }
    }
  );
});

gulp.task("demo-html-css", () => {
  const sliderCssFilter = filter("node_modules/rc-slider/assets/index.css", {
    restore: true
  });

  return gulp
    .src(["demo/src/*.@(html|css)", "node_modules/rc-slider/assets/index.css"])
    .pipe(sliderCssFilter)
    .pipe(rename("rc-slider.css"))
    .pipe(sliderCssFilter.restore)
    .pipe(gulp.dest("demo/public"))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task("browser-sync", gulp.series("webpack", "demo-html-css"), () => {
  browserSync.init({
    notify: false,
    ghostMode: false,
    server: {
      baseDir: "demo/public"
    }
  });
});

gulp.task("watch", () => {
  gulp.watch("src/js/**/*", e => {
    const watchPath = gutil.colors.magenta(
      e.path.substring(e.path.lastIndexOf("/") + 1)
    );
    const type = gutil.colors.cyan(`${e.type}...`);
    gutil.log(`${watchPath} ${type}`);
  });

  gulp.watch("demo/src/*.@(html|css)", gulp.series("demo-html-css"));
});

gulp.task("gh-pages-start", shell.task(["git stash", "git checkout gh-pages"]));

gulp.task("copy-demo-to-root", () =>
  gulp.src("./demo/public/**/*").pipe(gulp.dest("./"))
);

gulp.task(
  "gh-pages-end",
  shell.task([
    "git add index.html demo.js *.css",
    "git commit --amend --no-edit",
    "git push origin gh-pages --force",
    "git checkout master",
    "git stash apply"
  ])
);

gulp.task('gh-pages', gulp.series("gh-pages-start", "copy-demo-to-root", "gh-pages-end", function (done) {
  done();
}));

gulp.task("lint", () =>
  gulp
    .src(["src/**/*.js*(x)", "demo/src/**/*.js*(x)", "test/**/*.js"])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
);

gulp.task("default", gulp.series("browser-sync", "watch"));
