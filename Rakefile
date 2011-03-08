require 'erb'
namespace :test do
  def get_test_files
    return  ENV['TEST'] ? [ "./tests/#{ENV['TEST']}.js2" ] : Dir['./tests/*.js2']
  end


  task :ringo => :dist do
    sh "./scripts/js2-node compile -m=ringo tests/src tests/ringo"
    Dir['tests/ringo/*.js'].each { |f| `ringo #{f}` }
  end

  task :node => :dist do
    sh "./scripts/js2-node compile -m=node tests/src tests/node"
    Dir['tests/node/*.js'].each { |f| `node #{f}` }
  end

  task :ruby => :dist do
    sh "./dist/gem/bin/js2 compile -m=browser tests/src tests/ruby"
    Dir['tests/ruby/*.js'].each { |f| `./dist/gem/bin/js2 run #{f}` }
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
task :test => [ 'test:test' ]

desc "ERBify all distributions"
task :dist do
  def js(f)
    if (f.match(/\.js2$/)) 
      return `js2-node render ./src/#{f}`
    else
      return File.read("./src/#{f}")
    end
  end

  core =  %W{ js2-class.js js2-lexer.js js2-parser.js }.collect do |f|
    js("core/#{f}")
  end.join("\n");

  common = %W{ Array FileSystem Updater Commander Decorators }.collect do |f|
    js("Common/#{f}.js2")
  end.join("\n");

  core += common

  Dir["./flavors/*.erb"].each do |file|
    puts "processing: #{file}"
    template = ERB.new(File.read(file)) 
    outfile = file.sub(/\.erb$/, '')
    File.open(outfile, 'w') { |f| f << template.result(binding) }
  end

  sh "cp ./flavors/node.js ./dist/npm/lib/js2.js"

  sh "cp ./flavors/ringo.js ./dist/ringo/lib/js2.js"
  sh "cp ./flavors/ringo-full.js ./dist/ringo/lib/js2-full.js"

  sh "cp ./flavors/ruby.js ./dist/gem/lib/js2/js2.js"

  sh "cp ./flavors/browser.js ./dist/browser/js2.js"
  sh "cp ./flavors/browser-full.js ./dist/browser/js2-full.js"
end

