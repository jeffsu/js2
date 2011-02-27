spec = Gem::Specification.new do |s|
  s.name    = 'builder'
  s.version = '1.0.0'
  s.summary = "Javascript Syntactic Sugar"
  s.description = %{A superset of the Javascript language to make development easier.}
  #s.files = Dir['bin/*'] + Dir['test/**/*.rb']
  s.files = Dir['bin/*']
  #s.require_path = 'lib'
  #s.autorequire  = 'js2'
  s.has_rdoc = false
  #s.extra_rdoc_files = Dir['[A-Z]*']
  #s.rdoc_options << '--title' <<  'Builder -- Easy XML Building'
  s.author   = "Jeff Su"
  s.email    = "me@jeffsu.com"
  s.homepage = "http://jeffsu.github.com"
  s.add_dependency('therubyracer', '0.8.1.pre3')
end
