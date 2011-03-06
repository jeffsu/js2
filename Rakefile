

task :compile do
  files = [ "./index.haml" ] + Dir['_layouts/*.haml'] + Dir['_post/*.haml']
  files.each do |f|
    sh %{ haml -E utf-8 #{f} #{f.sub(/\.haml$/,'.html')} }
  end
end
