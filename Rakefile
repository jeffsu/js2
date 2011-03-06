

task :compile do
  Dir['**/*.haml'].each do |f|
    sh %{ haml -E utf-8 #{f} #{f.sub(/\.haml$/,'.html')} }
  end
end
