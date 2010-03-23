begin
  require 'rubygems'
  require 'haml'
  require 'sass'
  require 'json'
rescue Exception
  puts "HAML is not supported"
end


class JS2::Parser::HamlEngine
  def hamlize (string)
    return Haml::Engine.new(string, { :ugly => true }).render(self).gsub(/\n/, '')
  end

  def sassify (string)
    return Sass::Engine.new(string, { :ugly => true }).render
  end
end
