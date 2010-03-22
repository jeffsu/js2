class JS2::Util::UniverseLookup
  def initialize
    @roots    = Hash.new
    @klasses  = Hash.new

    # key: file value: dependencies
    @affected = Hash.new
  end

  def store_root (root)
    @root_lookup[root.file] = root

    klasses.each do |k|
      (@klasses[k] ||= []) << root
    end
  end

  def store_comp (comp)
    comp.dependencies.each do |d|
      if root = @klasses[d]
        (@affected[root.file] ||= []) << comp.file
      else
        (@affected[d] ||= []) << comp.file
      end
    end
  end

  def files_affected_from (file)
    return @affected[file]
  end

  def has_changed?
  end
end
