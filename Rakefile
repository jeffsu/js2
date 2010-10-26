require 'rubygems'
require 'rake'
require 'echoe'

JS2_VERSION = '0.1.8'
Echoe.new('js2', JS2_VERSION) do |p|
  p.summary        = "Cross-Browser Object Oriented Javascript Compiler"
  p.description    = "Cross-Browser Object Oriented Javascript Compiler"
  p.url            = "http://github.com/jeffsu/js2"
  p.author         = "Jeff Su"
  p.email          = "me@jeffsu.com"
  p.ignore_pattern = ["tmp/*", "script/*", "test/out" ]
  p.development_dependencies = []

  p.runtime_dependencies = ["RubyInline"]
end

namespace :js2 do
  task :compile do
    system("cd ./lib/js2/ragel/; ruby helper.rb; ragel -C tokenizer.rl; mv tokenizer.c ../parser/tokenizer.rb")
  end

  task :install do
    Rake::Task['gem'].invoke
    system("sudo gem install ./pkg/js2-#{JS2_VERSION}.gem")
  end
end

