```
 _____         _      ____                                       _        
|_   _|____  _| |_   / ___|___  _ __ _ __  _   _  ___ ___  _ __ (_) __ _  
  | |/ _ \ \/ / __| | |   / _ \| '__| '_ \| | | |/ __/ _ \| '_ \| |/ _` | 
  | |  __/>  <| |_  | |__| (_) | |  | | | | |_| | (_| (_) | |_) | | (_| | 
  |_|\___/_/\_\\__|  \____\___/|_|  |_| |_|\__,_|\___\___/| .__/|_|\__,_| 
                                                          |_|
```

<h1 align="center">
	<br>
	<br>
	<img src="https://cdn.rawgit.com/hsalmeida/text-cornucopia/gh-pages/img/apple-icon-60x60.png" alt="cornucopia">
	<br>
	<br>
</h1>

> generate a bunch of strings from a list using a pattern, this is a cli from text cornucopia tool https://hsalmeida.github.io/text-cornucopia/

## Highlights
- cli commands
- multi outputs types
- redis support (beta)

## Install

```console
$ npm install -g cornucopia
```

## Before Usage

> some parameters ;)

generate a `input.properties` file in any directory, inside the module already has a fully generated file, you can use for a example or create a new one following this steps:

### Cornucopia Input Parameters

inside the input.properties, create this string: `[cornucopia]`, this is a key for input parameters.
create this strings above the key:

```console
input.directory = 
input.file = 
input.type = 
input.header = 
input.separator = 
```

fill in this parameters:
- with the directory where the list file is
- the name of the file (example: megaList.txt)
- the type of input file: txt, csv or any file with a list of strings
- if the has a header fill in with `true` or `false` if hasn`t
- the separator of the strings in input file, for instance, `,` comma is the most common

### Output Parameters

Your can define (more to come) 3 outputs:
- txt, with `[txt]` key in input.properties file
- csv, with `[csv]` key in input.properties file
- redis (beta), , with `[redis]` key in input.properties file

In txt and csv has two initial parameters

```console
out.directory = 
out.file = 
out.pattern =
```
fill in this parameters:
- with the directory where  file will be write
- the name of the file, example: result(.txt for txt)(.csv for csv)
- the pattern (read about pattern above)

### How to Write Patterns

the cornucopia split the input file line by line, using the separator parameter
each string separated by the separator acquire a number, the first is `0`
and it will be replaced in the pattern using `$` plus the number of string.

Example:
megaList.txt
```
1921,Albert Einstein,Frederick Soddy,None,Anatole France,Hjalmar Branting;Christian Lous Lange
1922,Niels Bohr	Francis William Aston,Archibald Hill;Otto Fritz Meyerhof,Jacinto Benavente,Fridtjof Nansen
1923,Robert Andrews Millikan,Fritz Pregl,Frederick Banting;John James Rickard Macleod,W. B. Yeats,None
1924,Manne Siegbahn,None,Willem Einthoven,Władysław Reymont,None
```

the `out.pattern` can be 

```
out.pattern = in $0 the nobel prize of Physics goes to $1, Chemistry for $2, Medicine for $3, Literature for $4 and Peace for $5.
```

the output file (if the parameters is right fill in) can be:

```
in 1921 the nobel prize of Physics goes to Albert Einstein, Chemistry for Frederick Soddy, Medicine for None, Literature for Anatole France and Peace for Hjalmar Branting;Christian Lous Lange.
in 1922 the nobel prize of Physics goes to Niels Bohr, Chemistry for Francis William Aston, Medicine for Archibald Hill;Otto Fritz Meyerhof, Literature for Jacinto Benavente and Peace for Fridtjof Nansen.
in 1923 the nobel prize of Physics goes to Robert Andrews Millikan, Chemistry for Fritz Pregl, Medicine for Frederick Banting;John James Rickard Macleod, Literature for W. B. Yeats and Peace for None.
in 1924 the nobel prize of Physics goes to Manne Siegbahn, Chemistry for None, Medicine for Willem Einthoven, Literature for Władysław Reymont and Peace for None.
```

You can output to csv and txt at the same time, using diferent patterns, just write `out.pattern` above `[txt]` and `[csv]` keys

### Limitations

Yout can use only 9 keys in patterns, from $0 to $9.

## Usage

```console
$ cornucopia
```

## Coming Soon

- elasticsearch
- dynamic detection
- more smart CLI
- remove limitations of pattern keys

## Maintainers

- [Hilton Almeida](https://github.com/hsalmeida)

## License

ISC