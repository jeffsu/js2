require 'erb'
namespace :test do
  task :default => :run

  desc "test everything"
  task :run do
    Dir["./tests/*.js2"].each do |file|
      js2 = `node scripts/compile.js #{file}`
      js  = `cat #{file.chop}`
      puts "#{file} #{js2 == js ? 'PASSED' : 'FAILED'}"
    end
  end

  desc "show compilation TEST=test1"
  task :compile do
    sh "node scripts/compile.js ./tests/#{ENV['TEST']}.js2"
  end

  desc "freeze test compilation"
  task :freeze do
    sh "node scripts/compile.js ./tests/#{ENV['TEST']}.js2 > ./tests/#{ENV['TEST']}.js"
  end
end

desc "ERBify all distributions"
task :dist do
  js2_class = nil
  core =  %W{ js2-class.js js2-lexer.js js2-parser.js }.collect do |f|
    out = File.read("./src/#{f}")
    js2_class = out if f.match(/js2-class\.js/)
    out
  end.join("\n");

  Dir["./dist-templates/*.erb"].each do |file|
    puts "processing: #{file}"
    template = ERB.new(File.read(file)) 
    outfile = file.sub(/-templates/, '').sub(/\.erb$/, '')
    File.open(outfile, 'w') { |f| f << template.result(binding) }
  end
end
