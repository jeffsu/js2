require 'erb'
class String
  def blank?
    return !! self.match(/^\s*$/)
  end
end

namespace :publish do
  task :gem do
    sh "cd ./dist/gem/; rm *.gem; gem build js2.gemspec; gem push js2*.gem"
  end

  task :npm do
    sh "cd ./dist/npm/; npm publish"
  end

  task :ringo do
    sh "cd ./dist/ringo/; git stash; git pull; git stash pop; git add -A; git commit -a; git push"
  end
end

namespace :test do
  def get_test_files
    return  ENV['TEST'] ? [ "./tests/#{ENV['TEST']}.js2" ] : Dir['./tests/*.js2']
  end

  task :ringo => :dist do
    sh "./scripts/js2-node compile -f=ringo tests/src tests/ringo"
    Dir['tests/ringo/*.js'].each { |f| out = `ringo #{f}`; puts out unless out.blank? }
  end

  task :node => :dist do
    sh "./scripts/js2-node compile -f=node tests/src tests/node"
    Dir['tests/node/*.js'].each { |f| out = `node #{f}`;  puts out unless out.blank? }
  end

  task :ruby => :dist do
    sh "./dist/gem/bin/js2 compile -f=browser tests/src tests/ruby"
    Dir['tests/ruby/*.js'].each { |f| out = `./dist/gem/bin/js2 run #{f}`; puts out unless out.blank? }
  end

  task :test => :dist do
    get_test_files.each do |file|
      got      = `node scripts/compile.js #{file}`
      expected = `cat #{file.sub(/js2$/, 'frozen.js')}`
      if got != expected
        puts "FAILED! #{file}"
      else
        puts "PASSED  #{file}"
      end
    end

  end

  desc "test everything"
  task :run => :dist  do
    get_test_files.each do |file|
      sh "node scripts/run.js #{file}"
    end
  end

  desc "show compilation TEST=test1"
  task :compile => :dist do
    get_test_files.each do |file|
      sh "node scripts/compile.js #{file}"
    end
  end

  desc "freeze test compilation"
  task :freeze => :dist do
    get_test_files.each do |file|
      input  = file
      output = file.sub(/js2$/, 'frozen.js')
      sh "node scripts/compile.js #{input} > #{output}"
    end
  end

end
task :test => [ 'dist', 'test:node', 'test:ringo', 'test:ruby' ]

namespace :dist do
  desc "ERBify all distributions"
  task :erb do
    version = File.read('./VERSION').chomp
    def js(f)
      command = ENV['COMMAND'] || 'js2-node'
      if (f.match(/\.js2$/)) 
        return `#{command} render -f=browser ./src/#{f}`
      else
        return File.read("./src/#{f}")
      end
    end

    core =  %W{ js2-class.js js2-lexer.js js2-parser.js }.collect do |f|
      js("core/#{f}")
    end.join("\n");

    common = %W{ Array FileSystem Updater Config Commander Decorators }.collect do |f|
      js("Common/#{f}.js2")
    end.join("\n");

    core += common

    Dir["./flavors/*.erb"].each do |file|
      puts "processing: #{file}"
      template = ERB.new(File.read(file)) 
      outfile = file.sub(/\.erb$/, '')
      File.open(outfile, 'w') { |f| f << template.result(binding) }
    end
  end

  desc "Copy files to proper distributions"
  task :cp do
    sh "cp CHANGELOG ./dist/npm/"
    sh "cp CHANGELOG ./dist/ringo/"
    sh "cp CHANGELOG ./dist/gem/"

    sh "cp ./flavors/node.js ./dist/npm/lib/js2.js"

    sh "cp ./flavors/ringo.js ./dist/ringo/lib/js2.js"
    sh "cp ./flavors/ringo-full.js ./dist/ringo/lib/js2-full.js"

    sh "cp ./flavors/ruby.js ./dist/gem/lib/js2/js2.js"

    sh "cp ./flavors/browser.js ./dist/browser/js2.js"
    sh "cp ./flavors/browser-full.js ./dist/browser/js2-full.js"

    sh "cp ./flavors/browser.js ./js2.js"
    sh "cp ./flavors/browser-full.js ./js2-full.js"

    sh "cp ./flavors/js2.gemspec ./dist/gem/js2.gemspec"
    sh "cp ./flavors/node.package.json ./dist/npm/package.json"
    sh "cp ./flavors/ringo.package.json ./dist/ringo/package.json"
  end

end
task :dist => [ 'dist:erb', 'dist:cp' ]


