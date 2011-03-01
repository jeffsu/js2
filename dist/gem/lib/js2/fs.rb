require 'fileutils'
class JS2::FS
  def initialize(context) 
    @ctx = context
  end

  def read(file)
    File.read(file)
  end

  def find(dir, ext, recursive) 
    lookup = recursive ? "**" : "."
    return Dir["#{lookup}/*.#{ext}"].collect { |f| File.expand_path(f) }.reject { |f| f.match(/^\./) }
  end

  def realpath(file)
    return File.expand_path(file)
  end

  def isDirectory(dir)
    return File.directory?(dir)
  end

  def mkPath(file)
    dir = File.dirname(file)
    FileUtils.mkdir_p(dir) unless File.directory?(dir)
  end

  def isFile(dir)
    return false unless dir
    return File.file?(dir)
  end

  def write(out, data) 
    File.open(out, 'w') { |f| f << data }
  end

  def mtime(file)
    File.stat(file).mtime
  rescue
    return 0
  end

  def setInterval(code, time)
    while true
      @ctx.eval(code)
      sleep(time/1000)
    end
  end
end
