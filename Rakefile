desc "compiles tokenizer"
task :compile_jison do
  sh "jison src/jison/js2-tokenizer.jison -o src/js2-tokenizer.js"
end

namespace :test do
  desc "test everything"
  task :default do
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
