# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = %q{js2}
  s.version = "0.1.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 1.2") if s.respond_to? :required_rubygems_version=
  s.authors = ["Jeff Su"]
  s.date = %q{2010-04-19}
  s.default_executable = %q{js2}
  s.description = %q{}
  s.email = %q{me@jeffsu.com}
  s.executables = ["js2"]
  s.extra_rdoc_files = ["README.md", "bin/js2", "lib/js2.rb", "lib/js2/parser/haml.rb", "lib/js2/parser/haml_engine.rb", "lib/js2/parser/lexer.rb", "lib/js2/parser/tokenizer.rb", "lib/js2/ragel/helper.rb", "lib/js2/ragel/tokenizer.rl", "lib/js2/ragel/tokenizer.rl.erb", "lib/js2/standard/class_node.rb", "lib/js2/standard/factory.rb", "lib/js2/standard/node.rb", "lib/js2/util/compilation.rb", "lib/js2/util/config.rb", "lib/js2/util/exec.rb", "lib/js2/util/file_handler.rb", "lib/js2/util/js2bootstrap.js2", "lib/js2/util/processor.rb", "lib/js2/util/rdoc.rb", "lib/js2/util/sel_decorator.rb"]
  s.files = ["Manifest", "README.md", "Rakefile", "bin/js2", "config/js2.yml", "js2.gemspec", "lib/js2.rb", "lib/js2/parser/haml.rb", "lib/js2/parser/haml_engine.rb", "lib/js2/parser/lexer.rb", "lib/js2/parser/tokenizer.rb", "lib/js2/ragel/helper.rb", "lib/js2/ragel/tokenizer.rl", "lib/js2/ragel/tokenizer.rl.erb", "lib/js2/standard/class_node.rb", "lib/js2/standard/factory.rb", "lib/js2/standard/node.rb", "lib/js2/util/compilation.rb", "lib/js2/util/config.rb", "lib/js2/util/exec.rb", "lib/js2/util/file_handler.rb", "lib/js2/util/js2bootstrap.js2", "lib/js2/util/processor.rb", "lib/js2/util/rdoc.rb", "lib/js2/util/sel_decorator.rb", "test/compiled/bar.js", "test/compiled/basic.comp.js", "test/compiled/basic.js", "test/compiled/foo.js", "test/fixtures/bar.js2", "test/fixtures/basic.js2", "test/fixtures/basic.js2.haml", "test/fixtures/basic.js2.yml", "test/fixtures/curry.js2", "test/fixtures/foo.js2", "test/fixtures/member.js2", "test/fixtures/private.js2", "test/fixtures/property.js2", "test/test_helper.rb", "test/test_js2.rb", "wiki/features.md", "wiki/installation.md"]
  s.homepage = %q{http://github.com/jeffsu/js2}
  s.rdoc_options = ["--line-numbers", "--inline-source", "--title", "Js2", "--main", "README.md"]
  s.require_paths = ["lib"]
  s.rubyforge_project = %q{js2}
  s.rubygems_version = %q{1.3.6}
  s.summary = %q{}
  s.test_files = ["test/test_helper.rb", "test/test_js2.rb"]

  if s.respond_to? :specification_version then
    current_version = Gem::Specification::CURRENT_SPECIFICATION_VERSION
    s.specification_version = 3

    if Gem::Version.new(Gem::RubyGemsVersion) >= Gem::Version.new('1.2.0') then
    else
    end
  else
  end
end
