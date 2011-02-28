spec = Gem::Specification.new do |s|
  s.name    = 'js2'
  s.version = '1.0.0.pre2'
  s.summary = "Javascript Syntactic Sugar"
  s.description = %{A superset of the Javascript language to make development easier.}
  s.files = Dir['bin/*'] + Dir['lib/**/*.rb'] + Dir['lib/**/*.js']
  s.bindir = 'bin'
  s.executables = [ 'js2-ruby', 'js2' ]
  #s.files = Dir['bin/*']
  #s.require_path = 'lib'
  #s.autorequire  = 'js2'
  s.has_rdoc = false
  #s.extra_rdoc_files = Dir['[A-Z]*']
  #s.rdoc_options << '--title' <<  'Builder -- Easy XML Building'
  s.author   = "Jeff Su"
  s.email    = "me@jeffsu.com"
  s.homepage = "http://jeffsu.github.com"
  s.add_dependency('therubyracer')
end