require 'fileutils'
class JS2::FS
  def read(file)
    File.read(file)
  end

  def find(dir, ext, recursive) 
    lookup = recursive ? "**" : "."
    return Dir["#{lookup}/*.#{ext}"].collect { |f| File.expand_path(f) }.reject { |f| f.match(/^\./) }
  end

  def expandPath(file)
    return File.expand_path(file)
  end

  def isDirectory(dir)
    return File.directory?(dir)
  end

  def dirname(file)
    return File.dirname(file)
  end

  def readdir(file)
    return Dir.entries(file).reject { |f| f.match(/^\.\.?/) }
  end


  def mkdir(dir)
    FileUtils.mkdir(dir) unless File.exists?(dir)
  end

  def isFile(dir)
    return false unless dir
    return File.file?(dir)
  end

  def write(out, data) 
    File.open(out, 'w') { |f| f << data }
  end

  def mtime(file)
    File.stat(file).mtime.to_i
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
