import fs from 'fs'
import gulp from 'gulp'
import path from 'path'
import hash from 'object-hash'
import babel from 'gulp-babel'
import concat from 'gulp-concat'
import gulpif from 'gulp-if'
import plumber from 'gulp-plumber'
import postcss from 'gulp-postcss'
import sourcemaps from 'gulp-sourcemaps'
import { execSync } from 'child_process'
import requireFresh from './require-fresh.js'

const NAMESPACE = 'compile'
const OUTPUT_CSS_NAME = 'app.css'

export default class CompileTasks {
  constructor(params) {
    const { publish, source, output } = params

    const staticAssetExtensions = 'svg'

    this.name = `${NAMESPACE}-${hash(params).substring(0, 3)}`
    this.css = `${this.name}:css`
    this.jsx = `${this.name}:jsx`
    this.html = `${this.name}:html`
    this.watch = `${this.name}:watch`
    this.signalLivereload = `${this.name}:livereload-signal`
    this.default = this.html
    this.params = params
    this.livereloadSignal = `livereload-${this.name}.signal.txt`

    gulp.task(this.watch, [this.html], () => {
      const basename = path.basename(source.publishedMetadata)
      const metaname = basename.replace(path.extname(basename), '')

      gulp.watch([
        `${source.css.root}/**/*.css`,
        `${source.js.web}/**/*.{js,jsx}`,
        `${source.js.tasks}/**/*.{js,jsx}`,
        `${source.assets}/**/*.${staticAssetExtensions}`,
        // apparently order matters, keep the blacklist at the bottom!
        `!${source.js.root}/${metaname}.js`,
      ], [this.signalLivereload])
    })

    const livereloadSignal = this.livereloadSignal
    gulp.task(this.signalLivereload, [this.html], () => {
      execSync(`touch ${output.root}/${livereloadSignal}`)
    })

    gulp.task(this.html, [this.jsx], () => {
      const renderPipeline =
        requireFresh('./compile/gulp-render-pipeline.js').default

      const scriptPaths = output.js.replace(`${output.root}/`, '/')
      const stylesheetPath = output.css.replace(`${output.root}/`, '/')

      return gulp.src(`${source.js.root}/**/*-page.jsx`)
        .pipe(plumber())
        .pipe(renderPipeline({
          appDir: source.js.root,
          buildDir: output.root,
          scriptPaths: scriptPaths,
          cdnPaths: {
            /* eslint-disable max-len */
            'preact': `https://cdnjs.cloudflare.com/ajax/libs/preact/${require('preact/package').version}/preact.js`,
            'requirejs': `https://cdnjs.cloudflare.com/ajax/libs/require.js/${require('requirejs').version}/require.js`,
            /* eslint-enable max-len */
          },
          globalStylesheet: `${stylesheetPath}/${OUTPUT_CSS_NAME}`,
        }).on('error', function onError() {
          console.log.call(console.log, arguments)
          this.emit('end')
        }))
        .pipe(gulp.dest(output.root))
    })

    gulp.task(this.css, () => {
      return gulp.src([
        `${source.css.root}/**/*.css`,
        `!${source.css.root}/**/_*.css`,
      ])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(postcss(compact([
          require('postcss-import')(),
          require('postcss-modules')({
            getJSON(cssFilename, json) {
              if (cssFilename.includes('global.css')) {
                return
              }

              const subpath = path.relative(source.js.root, cssFilename)
              const filename = path.join(output.artifacts, `${subpath}.json`)
              const directory = path.dirname(filename)

              /* eslint-disable no-sync */
              execSync(`mkdir -p ${directory}`)
              fs.writeFileSync(filename, JSON.stringify(json))
              /* eslint-enable no-sync */
            },
          }),
          require('postcss-url')(),
          require('postcss-cssnext')({
            versions: 'last 2 versions > 10%',
          }),
          require('postcss-inline-svg')({ path: './' }),
          require('postcss-browser-reporter')(),
        ])))
        .pipe(concat(OUTPUT_CSS_NAME))
        .pipe(postcss(compact([
          require('css-mqpacker')(),
          ifpublish(require('cssnano')()),
        ])))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(output.css))

      function compact(array) {
        return array.filter((item) => {
          return !!item
        })
      }

      function ifpublish(plugin) {
        return publish ? plugin : null
      }
    })

    gulp.task(this.jsx, [this.css], () => {
      const normalizeAMDModules =
        requireFresh('./compile/gulp-normalize-amd-modules.js').default
      /* eslint-disable no-sync */
      const babelConfig = JSON.parse(fs.readFileSync('./.babelrc').toString())
      /* eslint-enable no-sync */

      const sources = [`${source.js.root}/**/*.{js,jsx}`]

      return gulp.src(sources)
        .pipe(sourcemaps.init())
        .pipe(babel({
          ...babelConfig,
          plugins: [
            ...babelConfig.plugins,
            ['inline-json-import', {}],
            ['transform-es2015-modules-amd', {}],
          ],
        }))
        .pipe(normalizeAMDModules())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(output.js))
    })
  }
}
