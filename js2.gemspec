# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = %q{js2}
  s.version = "0.1.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 1.2") if s.respond_to? :required_rubygems_version=
  s.authors = ["Jeff Su"]
  s.date = %q{2010-03-21}
  s.description = %q{}
  s.email = %q{me@jeffsu.com}
  s.extra_rdoc_files = ["README", "lib/js2.rb"]
  s.files = ["README", "Rakefile", "lib/js2.rb", "Manifest", "js2.gemspec"]
  s.homepage = %q{http://github.com/jeffsu/js2}
  s.rdoc_options = ["--line-numbers", "--inline-source", "--title", "Js2", "--main", "README"]
  s.require_paths = ["lib"]
  s.rubyforge_project = %q{js2}
  s.rubygems_version = %q{1.3.5}
  s.summary = %q{}

  if s.respond_to? :specification_version then
    current_version = Gem::Specification::CURRENT_SPECIFICATION_VERSION
    s.specification_version = 3

    if Gem::Version.new(Gem::RubyGemsVersion) >= Gem::Version.new('1.2.0') then
    else
    end
  else
  end
end
