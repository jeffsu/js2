class JS2::Standard::Factory
  @@supports = [ :CLASS, :MEMBER, :METHOD ]
  @@lookup = Hash.new

  def initialize ()
  end

  def new_node (type, idx, string)
    klass = @@lookup[type]
    return klass.new(idx, string, self)
  end

  @@supports.each do |v|
    name = v.to_s.downcase.sub(/(\w)/) { |m| m.upcase }
    @@lookup[v] = eval "JS2::Standard::#{name}"
  end
end
