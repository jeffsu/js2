require 'rubygems'
require 'rake'
require 'echoe'

Echoe.new('js2', '0.1.1') do |p|
  p.description    = ""
  p.url            = "http://github.com/jeffsu/js2"
  p.author         = "Jeff Su"
  p.email          = "me@jeffsu.com"
  p.ignore_pattern = ["tmp/*", "script/*"]
  p.development_dependencies = []
end

namespace :js2 do
  task :compile do
    system("pushd lib/js2/ragel/; ruby helper.rb; ragel -C tokenizer.rl; mv tokenizer.c ../parser/tokenizer.rb")
  end
end
